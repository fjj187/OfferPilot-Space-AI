import type { getFilterResponse } from '@/store/utils/mixin'

import type router from '@/router'
import type { AxiosRequestConfig, GenericAbortSignal } from 'axios'

declare module 'vue' {
  /**
   *
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ComponentCustomProperties extends Window {
    // ...

  }
}

declare module 'axios' {
  export interface RequestConcurrencyConfig {
    enabled?: boolean
    maxConcurrentRequests?: number
    queueTimeoutMs?: number
  }

  export interface RequestRetryConfig {
    enabled?: boolean
    maxRetries: number
    retryDelayMs?: number
    backoffMultiplier?: number
    retryableStatusCodes?: number[]
  }

  export interface RequestCircuitBreakerConfig {
    enabled?: boolean
    failureThreshold?: number
    cooldownMs?: number
    halfOpenMaxRequests?: number
    key?: string
  }

  /**
   * Costom Axios Field.
   */
  export interface AxiosRequestConfig {
    redirect?: string
    /**
     * 是否触发浏览器下载弹框，默认会触发（仅限 blob type）
     */
    autoDownLoadFile?: boolean
    concurrency?: RequestConcurrencyConfig
    circuitBreaker?: RequestCircuitBreakerConfig
    retry?: RequestRetryConfig
    requestName?: string
    __retryCount?: number
    __releaseConcurrency?: (() => void) | null
    __circuitBreakerKey?: string
  }
}

declare module 'pinia' {
  export interface PiniaCustomProperties {
    filterResponse: typeof getFilterResponse
    router: typeof router
  }
}

declare module 'vue-router' {
  export interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    requiredRole?: 'user' | 'admin'
    guestOnly?: boolean
    public?: boolean
  }
}

declare global {

  /**
   * General Object Types.
   */
  type ObjectValueSuite<T = any> = { [key in any]: T }

  /**
   * `error`: Response Status Code.
   *
   * `data`: Response Body.
   *
   * `msg`: Response Message.
   */
  export interface IRequestData {
    error: number
    data: any
    msg: string
    aborted?: boolean
    errorType?: 'http' | 'network' | 'timeout' | 'aborted' | 'queue_timeout' | 'circuit_open' | 'unknown'
    retryable?: boolean
  }

  interface IRequestSuite {
    get(uri: string, params?: ObjectValueSuite, config?: AxiosRequestConfig): Promise<IRequestData>
    post(uri: string, data?: any, config?: AxiosRequestConfig): Promise<IRequestData>
    put(uri: string, data?: any, config?: AxiosRequestConfig): Promise<IRequestData>
    patch(uri: string, data?: any, config?: AxiosRequestConfig): Promise<IRequestData>
    delete(uri: string, config?: AxiosRequestConfig): Promise<IRequestData>
  }

  type IModulesApiSuite = ObjectValueSuite<(...args: any) => Promise<IRequestData>>

  /**
   * Store FilterResponse Callback Type.
   */
  type IStoreFilterCallBack = (res: IRequestData) => Promise<IRequestData> | void

}
export { }
