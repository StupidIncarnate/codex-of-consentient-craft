import { pid } from './pid';

describe('pid', () => {
  it('VALID: {} => is the same value process.pid holds', () => {
    expect(pid).toBe(process.pid);
  });
});
