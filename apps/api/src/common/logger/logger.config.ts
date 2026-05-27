import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

export const winstonConfig: winston.LoggerOptions = {
  level: isProduction ? 'warn' : 'debug',
  format: isProduction
    ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      )
    : winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        nestWinstonModuleUtilities.format.nestLike('Vantage', {
          colors: true,
          prettyPrint: true,
        }),
      ),
  transports: [
    new winston.transports.Console(),
    ...(isProduction
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 10 * 1024 * 1024, // 10 MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 10 * 1024 * 1024,
            maxFiles: 10,
          }),
        ]
      : []),
  ],
};
