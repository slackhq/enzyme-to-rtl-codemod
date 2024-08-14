import { createCustomLogger, updateLogLevelForAllLoggers } from './logger';

describe('createCustomLogger', () => {
    it('should use the default log level info', () => {
        const logger = createCustomLogger('test-label');
        expect(logger.level).toBe('info');
    });

    it('should create a logger and emit logs', () => {
        const label = 'test-label';
        const logger = createCustomLogger(label);
        const spyInfo = jest.spyOn(logger, 'info');

        logger.info('Test log');
        expect(spyInfo).toHaveBeenNthCalledWith(1, 'Test log');
    });

    it('should silence the logger in test environment', () => {
        const label = 'test-label';
        const logger = createCustomLogger(label);

        expect(logger.silent).toBe(true);
    });

    it('should not silence the logger in non-test environments', () => {
        process.env.NODE_ENV = 'production';
        const label = 'test-label';
        const logger = createCustomLogger(label);
        expect(logger.silent).toBe(false);
    });
});

describe('updateLogLevelForAllLoggers', () => {
    it('should update the log level for all loggers', () => {
        const logger1 = createCustomLogger('logger1');
        const logger2 = createCustomLogger('logger2');

        updateLogLevelForAllLoggers('verbose');

        expect(logger1.level).toBe('verbose');
        expect(logger2.level).toBe('verbose');
    });
});
