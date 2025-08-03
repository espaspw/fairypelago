import winston from 'winston'
import 'winston-daily-rotate-file'

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'all-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
});

const exceptionRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'exceptions-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
});

const rejectionRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'rejections-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
});

const { combine, json, timestamp, errors, align, printf, colorize } = winston.format

export const fileLogger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports: [fileRotateTransport],
  exceptionHandlers: [exceptionRotateTransport],
  rejectionHandlers: [rejectionRotateTransport],
})

export const consoleLogger = winston.createLogger({
  level: 'warn',
  format: combine(
    align(),
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS A', }),
    printf((info) => `[${info.timestamp}] ${info.level} | ${info.message}`),
  ),
  transports: [new winston.transports.Console()],
})
