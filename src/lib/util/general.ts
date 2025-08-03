import { consoleLogger, fileLogger } from './logger'

// Generic decorator for event handlers, ensuring errors in a handler
// are logged and do not crash the program.
export function catchAndLogError(func: (...args) => Promise<void>) {
  return async (...args) => {
    try {
      await func(...args)
    } catch (err) {
      consoleLogger.error(err)
      fileLogger.error(err)
    }
  }
}