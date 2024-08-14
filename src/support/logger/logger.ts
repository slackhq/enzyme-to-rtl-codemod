import { Logger, createLogger, format, transports } from 'winston';

// Global variable to store the current log level
const currentLogLevel = process.env.LOG_LEVEL || 'info';

// Create custom logging format
const logPrintFormat = format.printf(
    ({ level, message, label, timestamp }) =>
        `${timestamp} - [${label}] - ${level}: ${message}`,
);

// Array to store all logger instances
const loggers: Logger[] = [];

// Function to create a logger with a custom label
const createCustomLogger = (label: string): Logger => {
    const logger = createLogger({
        level: currentLogLevel, // Use the global log level variable
        format: format.combine(
            format.label({ label }),
            format.timestamp(),
            format.colorize(),
            logPrintFormat,
        ),
        silent: process.env.NODE_ENV === 'test',
        transports: [new transports.Console()],
    });

    // Store the logger instance in the array
    loggers.push(logger);

    return logger;
};

// Function to update the log level for all loggers
const updateLogLevelForAllLoggers = (logLevel: string): void => {
    loggers.forEach((logger) => {
        logger.level = logLevel;
    });
};

// Export the necessary components
export { createCustomLogger, updateLogLevelForAllLoggers };
