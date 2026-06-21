import 'dotenv/config'

const readEnv = (key: string, fallback = '') => process.env[key]?.trim() || fallback

const readBooleanEnv = (key: string, fallback: boolean) => {
  const raw = readEnv(key)
  if (!raw) return fallback
  return raw === '1' || raw.toLowerCase() === 'true' || raw.toLowerCase() === 'yes'
}

export const backendEnv = {
  port: Number(readEnv('PORT', '3030')),
  provider: readEnv('INTERVIEW_PROVIDER', 'mock'),
  remoteVendor: readEnv('INTERVIEW_REMOTE_VENDOR', 'openai-compatible'),
  remoteBaseUrl: readEnv('INTERVIEW_REMOTE_BASE_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1'),
  remoteModel: readEnv('INTERVIEW_REMOTE_MODEL'),
  remoteApiKey: readEnv('INTERVIEW_REMOTE_API_KEY'),
  /** qwen3.6-plus 等混合思考模型默认开思考，面试反馈场景默认关闭以降延迟 */
  remoteEnableThinking: readBooleanEnv('INTERVIEW_REMOTE_ENABLE_THINKING', false),
  storageDir: readEnv('INTERVIEW_STORAGE_DIR', 'data'),
  authTokenSecret: readEnv('AUTH_TOKEN_SECRET', 'offerpilot-admin-secret'),
  demoUserUsername: readEnv('DEMO_USER_USERNAME', 'user'),
  demoUserPassword: readEnv('DEMO_USER_PASSWORD', 'user'),
  demoAdminUsername: readEnv('DEMO_ADMIN_USERNAME', 'admin'),
  demoAdminPassword: readEnv('DEMO_ADMIN_PASSWORD', 'admin')
}
