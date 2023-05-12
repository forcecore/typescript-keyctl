import cp = require('child_process');
import stream  = require('stream');
import { KeyctlOperationError } from './keyctlErrors';

/**
 * Check for availability of as shell program
 * @param command command to check
 * @returns
 */
function isCommandAvailable(command: string): boolean {
  try {
    cp.execSync(`which ${command}`);
    return true;
  } catch (error) {
    return false;
  }
}

function system(args: string[], data: string | null = null, check: boolean = true): Promise<string | [number, string, string]> {
  return new Promise<string | [number, string, string]>((resolve, reject) => {
    const subprocess = cp.spawn(args[0], args.slice(1));

    let stdout = '';
    let stderr = '';

    subprocess.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    subprocess.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    subprocess.on('error', (error: Error) => {
      reject(new Error(`Command '${args.join(' ')}' execution failed. ErrMsg:${error.message}`));
    });

    subprocess.on('close', (code: number) => {
      if (!check) {
        resolve([code, stdout, stderr]);
      } else if (code === 0) {
        resolve(stdout);
      } else {
        reject(new KeyctlOperationError(`(${code})${stderr} ${stdout}`));
      }
    });

    if (data !== null) {
      const readable = new stream.Readable();
      readable.push(data);
      readable.push(null);
      readable.pipe(subprocess.stdin);
    }
  });
}

export { isCommandAvailable, system };
