import { isCommandAvailable, system } from '../sysUtils';
import { KeyctlOperationError } from '../keyctlErrors';

test('isCommandAvailable false', () => {
  expect(isCommandAvailable('non-existsant')).toBeFalsy();
});

test('isCommandAvailable true', () => {
  expect(isCommandAvailable('cp')).toBeTruthy();
});

test('system echo hello world', async () => {
  const stdout = await system(['echo', 'hello', 'world']);
  expect(stdout).toBe('hello world\n');
});

test('system echo hello unchecked', async () => {
  const [errorCode, stdout, stderr] = await system(['echo', 'hello', 'world'], null, false);
  expect(errorCode).toBe(0);
  expect(stdout).toBe('hello world\n');
  expect(stderr).toBe('');
});

test('cat hello world', async () => {
  const stdout = await system(['cat'], 'hello world');
  expect(stdout).toBe('hello world');
});

test('cat hello world unchecked', async () => {
  const [errorCode, stdout, stderr] = await system(['cat'], 'hello world', false);
  expect(errorCode).toBe(0);
  expect(stdout).toBe('hello world');
  expect(stderr).toBe('');
});

test('system xxcp xx checked', async () => {
  // Failed to execute anything, as command is not found.
  const task = system(['xxcp', 'xx']);
  expect(task).rejects.toThrow();
});

test('system xxcp xx unchecked', async () => {
  // Failed to execute anything, as command is not found.
  const task = system(['xxcp', 'xx'], null, false);
  expect(task).rejects.toThrow();
});

test('cp xx checked', async () => {
  // Program ran with invalid args
  const task = system(['cp', 'xx'], null, true);
  expect(task).rejects.toThrowError(/missing destination file operand after 'xx'/);

  const task2 = system(['cp', 'xx'], null, true);
  expect(task2).rejects.toThrow(KeyctlOperationError);
});

test('cp xx unchecked', async () => {
  // Program ran with invalid args
  const [errorCode, stdout, stderr] = await system(['cp', 'xx'], null, false);
  expect(errorCode).not.toBe(0);
  expect(stdout).toBe('');
  expect(stderr).toMatch(/missing destination file operand after 'xx'/);
});

test('tee /root/xxx checked', async () => {
  // Program ran with invalid args
  const task = system(['tee', '/root/xxx'], 'contents-to-write', true);
  expect(task).rejects.toThrowError(/Permission denied/);

  const task2 = system(['tee', '/root/xxx'], null, true);
  expect(task2).rejects.toThrow(KeyctlOperationError);
});

test('tee /root/xxx unchecked', async () => {
  // Program ran with invalid args
  const [errorCode, stdout, stderr] = await system(['tee', '/root/xxx'], 'contents-to-write', false);
  expect(errorCode).not.toBe(0);
  expect(stderr).toMatch(/Permission denied/);
});
