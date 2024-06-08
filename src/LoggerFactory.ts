import { transports, format } from 'winston';
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston';

export const LoggerFactory = (appName: string) => {
  let consoleFormat;

  const DEBUG = process.env.DEBUG;
  const USE_JSON_LOGGER = process.env.USE_JSON_LOGGER;

  if (USE_JSON_LOGGER === 'true') {
    consoleFormat = format.combine(
      format.ms(),
      format.timestamp(),
      format.json(),
    );
  } else {
    consoleFormat = format.combine(
      format.timestamp(),
      format.ms(),
      nestWinstonModuleUtilities.format.nestLike(appName, {
        colors: true,
        prettyPrint: true,
      }),
    );
  }

  //   process.on('uncaughtException', (error) => {
  //     new Logger().error('Uncaught Exception:', error);
  //   });

  //   process.on('unhandledRejection', (reason, promise) => {
  //     new Logger().error('Unhandled Rejection at:', promise, 'reason:', reason);
  //   });

  return WinstonModule.createLogger({
    level: DEBUG ? 'debug' : 'info',
    transports: [
      new transports.Console({ format: consoleFormat }),
      new transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: format.combine(
          format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          format.errors({ stack: true }),
          format.json(),
        ),
      }),
    ],
    exceptionHandlers: [
      new transports.File({ filename: 'logs/exceptions.log' }),
    ],
    rejectionHandlers: [
      new transports.File({ filename: 'logs/rejections.log' }),
    ],
  });
};
