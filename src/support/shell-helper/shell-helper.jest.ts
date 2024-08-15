import { runCommand } from './shell-helper';

describe('runCommand Integration Test', () => {
    it('should execute "echo hello" command and return the output', async () => {
        const command = 'echo hello';

        const result = await runCommand(command);
        expect(result.finished).toBe(true);
        expect(result.command).toBe(command);
        expect(result.output).toBe('hello\n');
        expect(result.stderr).toBe('');
    });

    it('should handle a command that generates an error', async () => {
        const command = 'ls non_existing_directory';

        const result = await runCommand(command);

        expect(result.finished).toBe(true);
        expect(result.command).toBe(command);
        expect(result.output).toBe('');
        expect(result.stderr).toBe(
            "ls: cannot access 'non_existing_directory': No such file or directory\n",
        );
    });

    // Not enabling to avoid long running test
    it.skip('should kill the process if it runs longer than the allowed time', async () => {
        const command = 'sleep 302';
        try {
            await runCommand(command);
        } catch (error) {
            // Ensure the error message indicates that the process was killed
            const typedError = error as Error;
            expect(typedError).toBeDefined();
            expect(typedError.message).toContain('Failed to finish after');
        }
    }, 40000);
});
