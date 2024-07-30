import { Logger, createLogger, format, transports } from 'winston';

/**
 * Configure log level
 * Winston logging levels, see: https://github.com/winstonjs/winston#logging
 *
 */
const loggerLevel = process.env.LOG_LEVEL || 'info';

// Create custom logging format
const logPrintFormat = format.printf(
    ({ level, message, label, timestamp }) =>
        `${timestamp} - [${label}] - ${level}: ${message}`,
);

// Function to create a logger with a custom label
const createCustomLogger = (label: string): Logger => {
    return createLogger({
        level: loggerLevel,
        format: format.combine(
            format.label({ label }),
            format.timestamp(),
            format.colorize(),
            logPrintFormat,
        ),
        transports: [new transports.Console()],
    });
};

export default createCustomLogger;
