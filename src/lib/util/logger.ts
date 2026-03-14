import winston from 'winston'
import 'winston-daily-rotate-file'

const { combine, json, timestamp, errors, align, printf, colorize } = winston.format

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/all-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  format: combine(errors({ stack: true }), timestamp(), json()),
})

const exceptionRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/exceptions-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
})

const rejectionRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/rejections-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
})

const consoleTransport = new winston.transports.Console({
  format: combine(
    align(),
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS A' }),
    printf((info) => `[${info.timestamp}] ${info.level} | ${info.message}`),
  ),
})

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  transports: [
    fileRotateTransport,
    consoleTransport,
  ],
  exceptionHandlers: [exceptionRotateTransport],
  rejectionHandlers: [rejectionRotateTransport],
})

export const fileLogger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  transports: [fileRotateTransport],
})

export const consoleLogger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  transports: [consoleTransport],
})
