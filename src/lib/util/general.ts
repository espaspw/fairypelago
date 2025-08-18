import { consoleLogger, fileLogger } from './logger'

// Generic decorator for event handlers, ensuring errors in a handler
// are logged and do not crash the program.
export function catchAndLogError<T>(func: (...args: T) => Promise<void>) {
  return async (...args: T) => {
    try {
      await func(...args)
    } catch (err) {
      consoleLogger.error(err)
      fileLogger.error(err)
    }
  }
}