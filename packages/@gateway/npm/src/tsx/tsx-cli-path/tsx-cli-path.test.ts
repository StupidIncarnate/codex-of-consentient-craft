import { existsSync } from 'fs';
import { basename, isAbsolute } from 'path';
import { tsxCliPath } from './tsx-cli-path';

describe('tsxCliPath', () => {
  it('VALID: {} => an absolute path to a real cli file inside the tsx package', () => {
    const result = tsxCliPath();

    expect({
      absolute: isAbsolute(result),
      exists: existsSync(result),
      name: basename(result, '.mjs'),
      insideTsx: result.includes('/node_modules/tsx/'),
    }).toStrictEqual({ absolute: true, exists: true, name: 'cli', insideTsx: true });
  });
});
