// Check if running in browser environment
const isServer = typeof window === 'undefined'

let PrismaClient: any

// Import PrismaClient conditionally
if (isServer) {
  const { PrismaClient: ServerPrismaClient } = require('@prisma/client')
  PrismaClient = ServerPrismaClient
} else {
  // For browser, create a mock client
  PrismaClient = class MockPrismaClient {
    constructor() {
      return new Proxy(this, {
        get(target, prop) {
          // Return mock functions for all database operations
          if (typeof prop === 'string') {
            return new Proxy(() => {}, {
              get() {
                return () => Promise.resolve([])
              }
            })
          }
          return undefined
        }
      })
    }
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

export const prisma = isServer
  ? (globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    }))
  : new PrismaClient()

if (process.env.NODE_ENV !== 'production' && isServer) {
  globalForPrisma.prisma = prisma
}