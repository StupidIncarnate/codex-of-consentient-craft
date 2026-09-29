import { realpathSync } from 'fs';
import { tmpdir } from 'os';
import { chdir } from './chdir';
import { chdirProxy } from './chdir.proxy';

describe('chdir', () => {
  it('VALID: {directory: an existing directory} => process.cwd() reports that directory', () => {
    const proxy = chdirProxy();
    const target = realpathSync(tmpdir());

    chdir(target);

    const result = process.cwd();
    proxy.restore();

    expect(result).toBe(target);
  });

  it('ERROR: {directory: one that does not exist} => throws Node ENOENT naming both directories', () => {
    const startingDirectory = process.cwd();
    const missing = `${realpathSync(tmpdir())}/dm-gateway-chdir-missing-directory`;

    expect(() => {
      chdir(missing);
    }).toThrow(`ENOENT: no such file or directory, chdir '${startingDirectory}' -> '${missing}'`);
  });

  describe('restore', () => {
    it('VALID: {restore called after a chdir} => process.cwd() is the starting directory again', () => {
      const startingDirectory = process.cwd();
      const proxy = chdirProxy();
      chdir(realpathSync(tmpdir()));

      proxy.restore();

      expect(process.cwd()).toBe(startingDirectory);
    });
  });
});
