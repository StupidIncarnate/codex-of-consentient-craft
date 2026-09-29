import { stdin } from './stdin';

describe('stdin', () => {
  it('VALID: {} => is the same Readable object process.stdin is', () => {
    expect(stdin).toBe(process.stdin);
  });
});
