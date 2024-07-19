/* eslint-disable no-console */
import * as child from 'child_process';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

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
export const runCommand = async (command: string): Promise<ShellProcess> => {
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
    });

    // Wait for shell.finished state
    await checkIfFinished(shell);

    return shell;
};

/**
 * Logic to wait for child process to finish executing
 * - Check if the close event was emitted, else wait for 5 sec
 * @param shell shell process
 */
const checkIfFinished = async (shell: ShellProcess): Promise<void | Error> => {
    const timeout = 5000;
    const waitingTimeoutTotal = 300000;
    let waitedFor = 0;

    while (!shell.finished) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(timeout);
        waitedFor += timeout;

        if (waitedFor > waitingTimeoutTotal) {
            // Kill the process
            throw new Error(
                `checkIfFinished\nFailed to finish after ${waitingTimeoutTotal} ms.\nCommand: ${
                    shell.command
                }\nCurrent output: \n${shell.output + shell.stderr}`,
            );
        }
    }
};
