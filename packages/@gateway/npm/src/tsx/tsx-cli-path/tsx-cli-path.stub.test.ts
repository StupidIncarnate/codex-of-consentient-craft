import { existsSync } from 'fs';
import { TsxCliPathStub } from './tsx-cli-path.stub';

describe('TsxCliPathStub', () => {
  it('VALID: {} => a path that exists on disk', () => {
    expect(existsSync(TsxCliPathStub())).toBe(true);
  });
});
