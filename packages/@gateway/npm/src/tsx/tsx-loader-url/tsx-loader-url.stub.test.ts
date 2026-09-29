import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { TsxLoaderUrlStub } from './tsx-loader-url.stub';

describe('TsxLoaderUrlStub', () => {
  it('VALID: {} => a URL that points at a file on disk', () => {
    expect(existsSync(fileURLToPath(TsxLoaderUrlStub()))).toBe(true);
  });
});
