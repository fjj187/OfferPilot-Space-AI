import cors from 'cors'
import express from 'express'
import { adminRouter } from './routes/admin-routes.js'
import { authRouter } from './routes/auth-routes.js'
import { healthRouter } from './routes/health-routes.js'
import { interviewRouter } from './routes/interview-routes.js'
import { backendEnv } from './utils/env.js'

const app = express()

app.use(cors({
  origin: true
}))

app.use(express.json({
  limit: '1mb'
}))

app.get('/', (_request, response) => {
  response.json({
    service: 'mock-interview-backend',
    status: 'running'
  })
})

app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.use('/api/interview', interviewRouter)

app.listen(backendEnv.port, () => {
  console.log(`[backend] listening on http://localhost:${ backendEnv.port }`)
})
