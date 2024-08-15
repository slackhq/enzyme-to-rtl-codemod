import * as child from 'child_process';

/**
 * Shell process type
 */
export interface ShellProcess {
    /**
     * Child process object
     */
    process: child.ChildProcessWithoutNullStreams;
    /**
     * Command output
     */
    output: string;
    /**
     * Command error output
     */
    stderr: string;
    /**
     * Process state
     */
    finished: boolean;
    /**
     * Command string
     */
    command: string;
}

/**
 * Run shell command
 * - Start child process with the command
 * - Listen to data output events and collect them
 * - Wait for completion for 4 minutes, else fail
 * @param command cli command, e.g. any shell command
 * @returns command output
 */
export const runCommand = (command: string): Promise<ShellProcess> => {
    return new Promise((resolve, reject) => {
        // Start child process
        const childProcess = child.spawn(command, {
            shell: true,
        });

        // Set shell object
        const shell: ShellProcess = {
            process: childProcess,
            output: '',
            stderr: '',
            finished: false,
            command,
        };

        // Listen to data event that returns all the output and collect it
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        childProcess.stdout.on('data', (data: any) => {
            shell.output += data.toString();
        });

        // Collect error output
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        childProcess.stderr.on('data', (data: any) => {
            shell.stderr += data.toString();
        });

        // Set the finished flag to true on close event
        childProcess.on('close', () => {
            shell.finished = true;
            resolve(shell);
            clearTimeout(timeout);
        });

        // Handle errors from the child process
        childProcess.on('error', (error) => {
            reject(error);
        });

        // Race between process completion and timeout
        const timeoutTime = 180000;
        const timeout = setTimeout(() => {
            shell.process.kill();
            reject(
                new Error(
                    `Failed to finish after ${timeoutTime / 1000 / 60} minutes`,
                ),
            );
        }, timeoutTime);
    });
};
