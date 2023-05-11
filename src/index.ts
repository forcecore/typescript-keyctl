import { execSync } from 'child_process'; // install @types/node

/**
 * Check for availability of as shell program
 * @param command command to check
 * @returns
 */
function isCommandAvailable(command: string): boolean {
  try {
    execSync(`which ${command}`);
    return true;
  } catch (error) {
    return false;
  }
}

export { isCommandAvailable };
