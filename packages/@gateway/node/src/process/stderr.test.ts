import { stderr } from './stderr';

describe('stderr', () => {
  it('VALID: {} => is the same Writable object process.stderr is', () => {
    expect(stderr).toBe(process.stderr);
  });
});
