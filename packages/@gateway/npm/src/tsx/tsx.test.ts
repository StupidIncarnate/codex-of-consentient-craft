import { tsxCliPath as directCliPath } from './tsx-cli-path/tsx-cli-path';
import { tsxLoaderUrl as directLoaderUrl } from './tsx-loader-url/tsx-loader-url';
import { tsxCliPath, tsxLoaderUrl } from './tsx';

describe('#gateway/npm/tsx', () => {
  it('VALID: {module} => exports the same functions the folders hold', () => {
    expect({ tsxCliPath, tsxLoaderUrl }).toStrictEqual({
      tsxCliPath: directCliPath,
      tsxLoaderUrl: directLoaderUrl,
    });
  });
});
