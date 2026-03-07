import { logger } from './logger.js'

// Generic decorator for event handlers, ensuring errors in a handler
// are logged and do not crash the program.
export function catchAndLogError<T extends any[], R> (func: (...args: T) => Promise<R>) {
  return async function (...args: T) {
    try {
      return await func(...args)
    } catch (error) {
      logger.error('Error in async execution', { error })
      return undefined
    }
  }
}
