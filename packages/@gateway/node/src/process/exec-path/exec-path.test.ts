import { execPath } from './exec-path';

describe('execPath', () => {
  it('VALID: {} => is the same value process.execPath holds', () => {
    expect(execPath).toBe(process.execPath);
  });
});
