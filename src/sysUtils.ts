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

function systemUnchecked(args: string[], data: string | null = null): Promise<[number, string, string]> {
  return new Promise<[number, string, string]>((resolve, reject) => {
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
      resolve([code, stdout, stderr]);
    });

    if (data !== null) {
      const readable = new stream.Readable();
      readable.push(data);
      readable.push(null);
      readable.pipe(subprocess.stdin);
    }
  });
}

async function system(args: string[], data: string | null = null): Promise<string> {
  const [code, stdout, stderr] = await systemUnchecked(args, data);
  if (code === 0) {
    return stdout;
  } else {
    throw new KeyctlOperationError(`(${code})${stderr} ${stdout}`);
  }
}

export { isCommandAvailable, system, systemUnchecked };
