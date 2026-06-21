const fallbackLocationHost = {
  hostname: 'localhost',
  baseApiIp: 'http://10.30.10.54:10001',
  baseApi: 'http://10.30.10.54:10001/api'
}

const hostList = [
  fallbackLocationHost
]

/**
 * 获取当前服务的 host（主机）前缀。
 * 这里只保留兜底配置，真正的开发环境接口地址由 request.ts（统一请求工具）优先走本地 /api 代理。
 */
export const currentHost = hostList.find(hostItem => window.location.hostname === hostItem.hostname) || fallbackLocationHost

/**
 * 统一解析 API（接口）基础地址：
 * 1. 优先使用显式环境变量，避免生产环境仍走开发代理。
 * 2. 开发环境默认走当前域名下的 /api，由 Vite（前端开发服务器）代理转发到本地 Node.js（后端运行时）。
 * 3. 最后才退回历史兜底地址，兼容旧配置。
 */
export const resolveApiBase = () => {
  const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim() || ''
  if (configuredBase) {
    return configuredBase.replace(/\/$/, '')
  }

  if (import.meta.env.DEV) {
    return `${ window.location.origin }/api`
  }

  return currentHost.baseApi
}
