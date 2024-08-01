import createCustomLogger from './logger';

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
});
