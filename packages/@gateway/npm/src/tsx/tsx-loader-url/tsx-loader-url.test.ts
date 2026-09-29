import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { tsxLoaderUrl } from './tsx-loader-url';

describe('tsxLoaderUrl', () => {
  it('VALID: {} => a file: URL whose path is a real file inside the tsx package', () => {
    const result = tsxLoaderUrl();
    const filePath = fileURLToPath(result);

    expect({
      scheme: result.startsWith('file://'),
      exists: existsSync(filePath),
      insideTsx: filePath.includes('/node_modules/tsx/'),
    }).toStrictEqual({ scheme: true, exists: true, insideTsx: true });
  });
});
