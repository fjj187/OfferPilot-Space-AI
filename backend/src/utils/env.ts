import 'dotenv/config'

const readEnv = (key: string, fallback = '') => process.env[key]?.trim() || fallback

export const backendEnv = {
  port: Number(readEnv('PORT', '3030')),
  provider: readEnv('INTERVIEW_PROVIDER', 'mock'),
  remoteVendor: readEnv('INTERVIEW_REMOTE_VENDOR', 'openai-compatible'),
  remoteBaseUrl: readEnv('INTERVIEW_REMOTE_BASE_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1'),
  remoteModel: readEnv('INTERVIEW_REMOTE_MODEL'),
  remoteApiKey: readEnv('INTERVIEW_REMOTE_API_KEY'),
  storageDir: readEnv('INTERVIEW_STORAGE_DIR', 'data')
}
