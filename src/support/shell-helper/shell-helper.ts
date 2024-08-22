import { spawn, ChildProcessWithoutNullStreams } from 'child_process';

/**
 * Represents a shell process and its outputs.
 */
export interface ShellProcess {
    /**
     * The spawned child process object.
     */
    process: ChildProcessWithoutNullStreams;
    /**
     * The standard output from the command.
     */
    output: string;
    /**
     * The standard error output from the command.
     */
    stderr: string;
    /**
     * The shell command executed.
     */
    command: string;
}

/**
 * Executes a shell command.
 * @param command - The shell command to run.
 * @param timeout - The maximum time allowed for the command to execute (default: 3 minutes).
 * @returns A promise resolving to the ShellProcess object containing the command outputs.
 */
export const runCommand = (
    command: string,
    timeout = 180000,
): Promise<ShellProcess> => {
    return new Promise((resolve, reject) => {
        // Spawn the child process with the given command
        const childProcess = spawn(command, { shell: true });

        // Initialize the ShellProcess object
        const shellProcess: ShellProcess = {
            process: childProcess,
            output: '',
            stderr: '',
            command,
        };

        // Capture standard output data
        childProcess.stdout.on('data', (data: Buffer) => {
            shellProcess.output += data.toString();
        });

        // Capture standard error data
        childProcess.stderr.on('data', (data: Buffer) => {
            shellProcess.stderr += data.toString();
        });

        // Resolve the promise once the process closes
        childProcess.on('close', () => {
            resolve(shellProcess);
            clearTimeout(timer);
        });

        // Reject the promise if the process encounters an error
        childProcess.on('error', (error) => {
            reject(error);
        });

        // Set up a timeout to kill the process if it takes too long
        const timer = setTimeout(() => {
            childProcess.kill();
            reject(
                new Error(
                    `Command timed out after ${timeout / 1000 / 60} minutes`,
                ),
            );
        }, timeout);
    });
};
