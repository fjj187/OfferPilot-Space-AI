import type { Response } from 'express'
import type { InterviewProviderEvent } from '../types/interview.js'

export const setupSSEResponse = (response: Response) => {
  response.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  response.setHeader('Cache-Control', 'no-cache, no-transform')
  response.setHeader('Connection', 'keep-alive')
  response.flushHeaders?.()
}

export const writeSSEEvent = (
  response: Response,
  eventName: InterviewProviderEvent['type'] | 'checkpoint',
  data: Record<string, unknown> = {}
) => {
  response.write(`event: ${ eventName }\n`)
  response.write(`data: ${ JSON.stringify(data) }\n\n`)
}
