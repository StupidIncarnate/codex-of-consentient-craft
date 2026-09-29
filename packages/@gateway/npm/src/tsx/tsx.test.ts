import { tsxCliPath as directPath } from './tsx-cli-path/tsx-cli-path';
import { tsxCliPath } from './tsx';

describe('#gateway/npm/tsx', () => {
  it('VALID: {module} => exports the same tsxCliPath function the folder holds', () => {
    expect(tsxCliPath).toBe(directPath);
  });
});
