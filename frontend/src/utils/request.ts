/* global
  IRequestSuite
*/
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import axios from 'axios'
import Cookie from 'js-cookie'

import Router from '@/router'
import { resolveApiBase } from '@/utils/location'

function errorRedirect(url: string) {
  Router.push(`/${ url }`)
}

const codeMessage: Record<number, string> = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队。',
  204: '删除数据成功。',
  206: '范围请求成功。',
  400: '请求参数有误，服务器没有执行对应操作。',
  401: '用户没有权限，请重新登录。',
  403: '用户已授权，但访问被禁止。',
  404: '请求的资源不存在。',
  405: '请求方法不被允许。',
  406: '请求格式不可用。',
  410: '请求的资源已被永久删除。',
  422: '请求参数校验失败。',
  500: '服务器内部错误，请检查后端服务。',
  502: '网关错误。',
  503: '服务暂时不可用，请稍后重试。',
  504: '网关超时。'
}

const DEFAULT_RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504]
const DEFAULT_RETRY_CONFIG = {
  enabled: true,
  maxRetries: 3,
  retryDelayMs: 800,
  backoffMultiplier: 1.6,
  retryableStatusCodes: DEFAULT_RETRYABLE_STATUS_CODES
} satisfies Required<Pick<
  NonNullable<AxiosRequestConfig['retry']>,
  'enabled' | 'maxRetries' | 'retryDelayMs' | 'backoffMultiplier' | 'retryableStatusCodes'
>>

const DEFAULT_CONCURRENCY_CONFIG = {
  enabled: true,
  maxConcurrentRequests: 10,
  queueTimeoutMs: 15_000
} satisfies Required<Pick<
  NonNullable<AxiosRequestConfig['concurrency']>,
  'enabled' | 'maxConcurrentRequests' | 'queueTimeoutMs'
>>

const DEFAULT_CIRCUIT_BREAKER_CONFIG = {
  enabled: true,
  failureThreshold: 3,
  cooldownMs: 30_000,
  halfOpenMaxRequests: 1
} satisfies Required<Pick<
  NonNullable<AxiosRequestConfig['circuitBreaker']>,
  'enabled' | 'failureThreshold' | 'cooldownMs' | 'halfOpenMaxRequests'
>>

type ResolvedRetryConfig = Required<NonNullable<AxiosRequestConfig['retry']>>
type ResolvedConcurrencyConfig = Required<NonNullable<AxiosRequestConfig['concurrency']>>
type ResolvedCircuitBreakerConfig = Required<NonNullable<AxiosRequestConfig['circuitBreaker']>>

type TokenBucketTicket = {
  release: () => void
}

type PendingAcquireRequest = {
  id: number
  resolve: (ticket: TokenBucketTicket) => void
  reject: (error: Error) => void
  timerId: number | null
  signal?: AbortSignal
  abortHandler?: () => void
}

class TokenBucket {
  private readonly maxConcurrentRequests: number
  private readonly queueTimeoutMs: number
  private activeCount = 0
  private queue: PendingAcquireRequest[] = []
  private nextId = 0

  constructor(config: ResolvedConcurrencyConfig) {
    this.maxConcurrentRequests = config.maxConcurrentRequests
    this.queueTimeoutMs = config.queueTimeoutMs
  }

  acquire(signal?: AbortSignal) {
    if (signal?.aborted) {
      return Promise.reject(createRequestError('请求在排队前已取消。', 'ERR_CANCELED'))
    }

    if (this.activeCount < this.maxConcurrentRequests) {
      return Promise.resolve(this.createTicket())
    }

    return new Promise<TokenBucketTicket>((resolve, reject) => {
      const pendingRequest: PendingAcquireRequest = {
        id: this.nextId++,
        resolve,
        reject,
        timerId: null,
        signal
      }

      if (signal) {
        pendingRequest.abortHandler = () => {
          this.removePendingRequest(pendingRequest.id)
          reject(createRequestError('请求在队列中已取消。', 'ERR_CANCELED'))
        }
        signal.addEventListener('abort', pendingRequest.abortHandler, { once: true })
      }

      pendingRequest.timerId = window.setTimeout(() => {
        this.removePendingRequest(pendingRequest.id)
        reject(createRequestError('请求排队超时，请稍后重试。', 'ERR_REQUEST_QUEUE_TIMEOUT'))
      }, this.queueTimeoutMs)

      this.queue.push(pendingRequest)
    })
  }

  private createTicket(): TokenBucketTicket {
    this.activeCount += 1

    let released = false
    return {
      release: () => {
        if (released) return
        released = true
        this.activeCount = Math.max(0, this.activeCount - 1)
        this.flushQueue()
      }
    }
  }

  private flushQueue() {
    while (this.activeCount < this.maxConcurrentRequests && this.queue.length > 0) {
      const nextRequest = this.queue.shift()
      if (!nextRequest) return

      if (nextRequest.signal?.aborted) {
        this.cleanupPendingRequest(nextRequest)
        nextRequest.reject(createRequestError('请求在出队前已取消。', 'ERR_CANCELED'))
        continue
      }

      this.cleanupPendingRequest(nextRequest)
      nextRequest.resolve(this.createTicket())
    }
  }

  private removePendingRequest(id: number) {
    const index = this.queue.findIndex(item => item.id === id)
    if (index < 0) return

    const [pendingRequest] = this.queue.splice(index, 1)
    this.cleanupPendingRequest(pendingRequest)
  }

  private cleanupPendingRequest(pendingRequest: PendingAcquireRequest) {
    if (pendingRequest.timerId !== null) {
      window.clearTimeout(pendingRequest.timerId)
      pendingRequest.timerId = null
    }

    if (pendingRequest.signal && pendingRequest.abortHandler) {
      pendingRequest.signal.removeEventListener('abort', pendingRequest.abortHandler)
      pendingRequest.abortHandler = undefined
    }
  }
}

type CircuitBreakerState = 'closed' | 'open' | 'half-open'

type CircuitBreakerRecord = {
  state: CircuitBreakerState
  failureCount: number
  openedAt: number | null
  halfOpenRequestCount: number
}

type CircuitBreakerRegistry = {
  beforeRequest: (key: string, config: ResolvedCircuitBreakerConfig) => void
  onSuccess: (key: string) => void
  onFailure: (key: string, config: ResolvedCircuitBreakerConfig) => void
}

const waitRetryDelay = (time = 0) => new Promise(resolve => setTimeout(resolve, time))

const createRequestError = (message: string, code: string) => {
  const error = new Error(message) as Error & { code?: string }
  error.code = code
  return error
}

const normalizeMethod = (method?: string) => (method || 'get').toUpperCase()

const normalizeRequestPath = (url?: string) => {
  if (!url) return '/'

  try {
    const parsedUrl = new URL(url, window.location.origin)
    return parsedUrl.pathname.replace(/\/+$/, '') || '/'
  } catch {
    return url.replace(/^https?:\/\/[^/]+/i, '').replace(/[?#].*$/, '').replace(/\/+$/, '') || '/'
  }
}

const isIdempotentMethod = (method?: string) => ['GET', 'HEAD', 'OPTIONS'].includes(normalizeMethod(method))

const resolveRetryConfig = (config: AxiosRequestConfig): ResolvedRetryConfig => {
  const requestRetry = config.retry
  if (requestRetry?.enabled === false) {
    return {
      ...DEFAULT_RETRY_CONFIG,
      ...requestRetry,
      enabled: false
    }
  }

  if (requestRetry) {
    return {
      ...DEFAULT_RETRY_CONFIG,
      ...requestRetry,
      enabled: requestRetry.enabled ?? true
    }
  }

  if (isIdempotentMethod(config.method)) {
    return { ...DEFAULT_RETRY_CONFIG }
  }

  return {
    ...DEFAULT_RETRY_CONFIG,
    enabled: false,
    maxRetries: 0
  }
}

const resolveConcurrencyConfig = (config: AxiosRequestConfig): ResolvedConcurrencyConfig => ({
  ...DEFAULT_CONCURRENCY_CONFIG,
  ...config.concurrency,
  enabled: config.concurrency?.enabled ?? DEFAULT_CONCURRENCY_CONFIG.enabled
})

const resolveCircuitBreakerConfig = (config: AxiosRequestConfig): ResolvedCircuitBreakerConfig => ({
  ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
  ...config.circuitBreaker,
  enabled: config.circuitBreaker?.enabled ?? DEFAULT_CIRCUIT_BREAKER_CONFIG.enabled,
  key: config.circuitBreaker?.key || ''
})

const resolveRetryDelay = (config: AxiosRequestConfig) => {
  const retry = resolveRetryConfig(config)
  const currentRetry = config.__retryCount || 0
  return Math.round(retry.retryDelayMs * Math.max(1, retry.backoffMultiplier ** Math.max(0, currentRetry - 1)))
}

const resolveErrorType = (error: AxiosError | (Error & { code?: string })): IRequestData['errorType'] => {
  if (error.code === 'ERR_CANCELED' || (isAxiosError(error) && error.config?.signal?.aborted)) {
    return 'aborted'
  }

  if (error.code === 'ECONNABORTED') {
    return 'timeout'
  }

  if (error.code === 'ERR_REQUEST_QUEUE_TIMEOUT') {
    return 'queue_timeout'
  }

  if (error.code === 'ERR_CIRCUIT_BREAKER_OPEN') {
    return 'circuit_open'
  }

  if (isAxiosError(error) && error.response) {
    return 'http'
  }

  if (isAxiosError(error) && error.request) {
    return 'network'
  }

  return 'unknown'
}

const isAxiosError = (error: unknown): error is AxiosError => axios.isAxiosError(error)

const shouldCountAsCircuitFailure = (error: AxiosError | (Error & { code?: string })) => {
  const errorType = resolveErrorType(error)
  if (errorType === 'timeout' || errorType === 'network') {
    return true
  }

  if (!isAxiosError(error) || !error.response) {
    return false
  }

  return error.response.status === 429 || error.response.status >= 500
}

const createCircuitBreakerRegistry = (): CircuitBreakerRegistry => {
  const registry = new Map<string, CircuitBreakerRecord>()

  const getRecord = (key: string): CircuitBreakerRecord => {
    const existingRecord = registry.get(key)
    if (existingRecord) return existingRecord

    const nextRecord: CircuitBreakerRecord = {
      state: 'closed',
      failureCount: 0,
      openedAt: null,
      halfOpenRequestCount: 0
    }
    registry.set(key, nextRecord)
    return nextRecord
  }

  return {
    beforeRequest(key, config) {
      const record = getRecord(key)
      const now = Date.now()

      if (record.state === 'open') {
        if (record.openedAt !== null && now - record.openedAt >= config.cooldownMs) {
          record.state = 'half-open'
          record.halfOpenRequestCount = 0
        } else {
          throw createRequestError('服务暂时熔断，请稍后再试。', 'ERR_CIRCUIT_BREAKER_OPEN')
        }
      }

      if (record.state === 'half-open') {
        if (record.halfOpenRequestCount >= config.halfOpenMaxRequests) {
          throw createRequestError('服务正在恢复中，请稍后再试。', 'ERR_CIRCUIT_BREAKER_OPEN')
        }
        record.halfOpenRequestCount += 1
      }
    },
    onSuccess(key) {
      const record = getRecord(key)
      record.state = 'closed'
      record.failureCount = 0
      record.openedAt = null
      record.halfOpenRequestCount = 0
    },
    onFailure(key, config) {
      const record = getRecord(key)

      if (record.state === 'half-open') {
        record.state = 'open'
        record.failureCount = config.failureThreshold
        record.openedAt = Date.now()
        record.halfOpenRequestCount = 0
        return
      }

      record.failureCount += 1
      if (record.failureCount >= config.failureThreshold) {
        record.state = 'open'
        record.openedAt = Date.now()
        record.halfOpenRequestCount = 0
      }
    }
  }
}

const tokenBucketRegistry = new Map<string, TokenBucket>()
const circuitBreakerRegistry = createCircuitBreakerRegistry()

const resolveTokenBucket = (config: ResolvedConcurrencyConfig) => {
  const bucketKey = `${ config.maxConcurrentRequests }-${ config.queueTimeoutMs }`
  const existingBucket = tokenBucketRegistry.get(bucketKey)
  if (existingBucket) return existingBucket

  const nextBucket = new TokenBucket(config)
  tokenBucketRegistry.set(bucketKey, nextBucket)
  return nextBucket
}

const resolveCircuitBreakerKey = (config: AxiosRequestConfig) => {
  const circuitConfig = resolveCircuitBreakerConfig(config)
  if (circuitConfig.key) {
    return circuitConfig.key
  }
  return `${ normalizeMethod(config.method) } ${ normalizeRequestPath(config.url) }`
}

const releaseConcurrency = (config?: AxiosRequestConfig) => {
  if (!config?.__releaseConcurrency) return
  config.__releaseConcurrency()
  config.__releaseConcurrency = null
}

const isRetryableRequestError = (error: AxiosError | (Error & { code?: string })) => {
  if (!isAxiosError(error)) return false

  const config = error.config
  if (!config) return false

  const retry = resolveRetryConfig(config)
  if (!retry.enabled) return false

  const currentRetry = config.__retryCount || 0
  if (currentRetry >= retry.maxRetries) return false

  if (config.signal?.aborted || error.code === 'ERR_CANCELED') {
    return false
  }

  if (error.response) {
    return retry.retryableStatusCodes.includes(error.response.status)
  }

  return error.code === 'ECONNABORTED' || Boolean(error.request)
}

const service: AxiosInstance = axios.create({
  baseURL: resolveApiBase(),
  timeout: 200000
})

const retryRequest = async (error: AxiosError) => {
  const config = error.config
  if (!config || !isRetryableRequestError(error)) {
    throw error
  }

  config.__retryCount = (config.__retryCount || 0) + 1
  await waitRetryDelay(resolveRetryDelay(config))

  return service(config)
}

service.interceptors.request.use(
  async request => {
    const token: string | undefined = Cookie.get('token')
    const normalizedUrl = String(request.url || '')
    const isAuthLoginRequest = /\/auth\/login$/i.test(normalizedUrl) || normalizedUrl === '/login'

    request.__retryCount = request.__retryCount || 0

    try {
      const concurrencyConfig = resolveConcurrencyConfig(request)
      if (concurrencyConfig.enabled) {
        const tokenBucket = resolveTokenBucket(concurrencyConfig)
        const ticket = await tokenBucket.acquire(request.signal)
        request.__releaseConcurrency = ticket.release
      } else {
        request.__releaseConcurrency = null
      }

      const circuitConfig = resolveCircuitBreakerConfig(request)
      if (circuitConfig.enabled) {
        const circuitKey = resolveCircuitBreakerKey(request)
        request.__circuitBreakerKey = circuitKey
        circuitBreakerRegistry.beforeRequest(circuitKey, circuitConfig)
      } else {
        request.__circuitBreakerKey = undefined
      }

      if (isAuthLoginRequest) {
        return request
      }

      if (token) {
        request.headers = request.headers || {}
        request.headers.Authorization = `Bearer ${ token }`
      }

      return request
    } catch (error) {
      releaseConcurrency(request)
      throw error
    }
  },
  error => Promise.reject(error)
)

service.interceptors.response.use(
  response => {
    releaseConcurrency(response.config)

    if (response.config.__circuitBreakerKey) {
      circuitBreakerRegistry.onSuccess(response.config.__circuitBreakerKey)
    }

    const data: any = response.data
    const msg: string = data?.msg || ''

    if (msg.includes('user not log in') && data?.error === -1) {
      errorRedirect('login')
      return
    }

    if (response.config.autoDownLoadFile === undefined || response.config.autoDownLoadFile) {
      Promise.resolve().then(() => {
        useResHeadersAPI(response.headers, data)
      })
    }

    if (
      response.request.responseType === 'blob'
      && /json$/gi.test(response.headers['content-type'])
    ) {
      return new Promise(resolve => {
        const reader = new FileReader()
        reader.readAsText(response.data as Blob)

        reader.onload = () => {
          if (!reader.result || typeof reader.result !== 'string') {
            return resolve(response.data)
          }

          response.data = JSON.parse(reader.result)
          resolve(response.data)
        }
      })
    }

    if (data instanceof Blob) {
      return {
        data,
        msg: '',
        error: 0
      }
    }

    if (data?.code && data?.data) {
      return {
        data: data.data,
        error: data.code === 200 ? 0 : -1,
        msg: 'ok'
      }
    }

    if (!data?.data && !data?.msg && !data?.error) {
      return {
        data,
        error: 0,
        msg: 'ok'
      }
    }

    if (data?.msg === null) {
      data.msg = 'Unknown error'
    }

    return data
  },
  error => {
    if (isAxiosError(error)) {
      releaseConcurrency(error.config)

      const circuitKey = error.config?.__circuitBreakerKey
      const circuitConfig = error.config ? resolveCircuitBreakerConfig(error.config) : null
      if (circuitKey && circuitConfig?.enabled && shouldCountAsCircuitFailure(error)) {
        circuitBreakerRegistry.onFailure(circuitKey, circuitConfig)
      }
    }

    if (error.config?.redirect) {
      errorRedirect(error.config.redirect)
    }

    return retryRequest(error).catch((finalError: AxiosError | (Error & { code?: string })) => {
      const errorType = resolveErrorType(finalError)

      if (isAxiosError(finalError) && finalError.response) {
        return {
          data: {},
          error: finalError.response.status,
          errorType,
          retryable: isRetryableRequestError(finalError),
          msg: codeMessage[finalError.response.status] || finalError.response.data?.message || '请求失败'
        }
      }

      console.log(finalError)
      return {
        data: {},
        error: 5000,
        errorType,
        retryable: isAxiosError(finalError) ? isRetryableRequestError(finalError) : false,
        aborted: isAxiosError(finalError) ? finalError.config?.signal?.aborted : finalError.code === 'ERR_CANCELED',
        msg: errorType === 'timeout'
          ? '服务请求超时，请稍后重试。'
          : errorType === 'aborted'
            ? '请求已取消。'
            : errorType === 'queue_timeout'
              ? '当前请求排队超时，请稍后重试。'
              : errorType === 'circuit_open'
                ? '服务暂时不可用，已暂停继续请求，请稍后再试。'
                : '服务请求不可用，请重试或检查您的网络。'
      }
    })
  }
)

function extractFileNameFromContentDispositionHeader(value: string) {
  const patterns = [
    /filename\*=[^']+'\w*'"([^"]+)";?/i,
    /filename\*=[^']+'\w*'([^;]+);?/i,
    /filename="([^;]*);?"/i,
    /filename=([^;]*);?/i
  ]

  let responseFilename: RegExpExecArray | null = null
  patterns.some(regex => {
    responseFilename = regex.exec(value)
    return responseFilename !== null
  })

  if (responseFilename !== null && responseFilename.length > 1) {
    try {
      return decodeURIComponent(responseFilename[1])
    } catch (error) {
      console.error(error)
    }
  }

  return null
}

export function downloadFile(blobData: BlobPart, filename = '默认文件名', type: string) {
  const blob = blobData instanceof Blob
    ? blobData
    : new Blob([blobData], { type })
  const url = window.URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.style.display = 'none'
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function useResHeadersAPI(headers: Record<string, string>, resData: any) {
  const disposition = headers['content-disposition']
  if (!disposition) return

  const filename = extractFileNameFromContentDispositionHeader(disposition)
  if (filename) {
    downloadFile(resData, filename, headers['content-type'])
  }
}

const requestSuite: IRequestSuite = {
  get(uri, params, config) {
    return service.get(uri, {
      params,
      ...config
    })
  },
  post(uri, data, config) {
    return service.post(uri, data, config)
  },
  put(uri, data, config) {
    return service.put(uri, data, config)
  },
  patch(uri, data, config) {
    return service.patch(uri, data, config)
  },
  delete(uri, config) {
    return service.delete(uri, config)
  }
}

export default requestSuite
