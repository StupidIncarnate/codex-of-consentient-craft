import { argv } from './argv';

describe('argv', () => {
  it('VALID: {} => is the same array process.argv is', () => {
    expect(argv).toBe(process.argv);
  });
});
