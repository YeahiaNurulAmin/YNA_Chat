import { clerkMiddleware } from '@clerk/express'

import { Webhook } from 'svix'

export const clerkWebhookMiddleware = clerkMiddleware();