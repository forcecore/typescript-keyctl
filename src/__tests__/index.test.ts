import { isCommandAvailable } from '../index';

test('isCommandAvailable true', () => {
  expect(isCommandAvailable('non-existsant')).toBeFalsy();
});

test('isCommandAvailable true', () => {
  expect(isCommandAvailable('cp')).toBeTruthy();
});
