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

const waitRetryDelay = (time = 0) => new Promise(resolve => setTimeout(resolve, time))

const resolveRetryDelay = (config: AxiosRequestConfig) => {
  const retry = config.retry
  const currentRetry = config.__retryCount || 0
  const retryDelayMs = retry?.retryDelayMs ?? 800
  const backoffMultiplier = retry?.backoffMultiplier ?? 1.6

  return Math.round(retryDelayMs * Math.max(1, backoffMultiplier ** Math.max(0, currentRetry - 1)))
}

const resolveErrorType = (error: AxiosError): IRequestData['errorType'] => {
  if (error.code === 'ERR_CANCELED' || error.config?.signal?.aborted) {
    return 'aborted'
  }

  if (error.code === 'ECONNABORTED') {
    return 'timeout'
  }

  if (error.response) {
    return 'http'
  }

  if (error.request) {
    return 'network'
  }

  return 'unknown'
}

const isRetryableRequestError = (error: AxiosError) => {
  const config = error.config
  const retry = config?.retry
  if (!config || !retry) return false

  const currentRetry = config.__retryCount || 0
  if (currentRetry >= retry.maxRetries) return false

  if (config.signal?.aborted || error.code === 'ERR_CANCELED') {
    return false
  }

  const retryableStatusCodes = retry.retryableStatusCodes || DEFAULT_RETRYABLE_STATUS_CODES
  if (error.response) {
    return retryableStatusCodes.includes(error.response.status)
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
  request => {
    const token: string | undefined = Cookie.get('token')
    const normalizedUrl = String(request.url || '')
    const isAuthLoginRequest = /\/auth\/login$/i.test(normalizedUrl) || normalizedUrl === '/login'

    if (isAuthLoginRequest) {
      return request
    }

    request.__retryCount = request.__retryCount || 0
    if (token) {
      request.headers = request.headers || {}
      request.headers.Authorization = `Bearer ${ token }`
    }
    return request
  },
  error => Promise.reject(error)
)

service.interceptors.response.use(
  response => {
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
    if (error.config?.redirect) {
      errorRedirect(error.config.redirect)
    }

    return retryRequest(error).catch((finalError: AxiosError) => {
      const errorType = resolveErrorType(finalError)

      if (finalError.response) {
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
        retryable: isRetryableRequestError(finalError),
        aborted: finalError.config?.signal?.aborted,
        msg: errorType === 'timeout'
          ? '服务请求超时，请稍后重试。'
          : errorType === 'aborted'
            ? '请求已取消。'
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
