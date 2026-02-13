import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsIsAccessibleAdapter } from './fs-is-accessible-adapter';
import { fsIsAccessibleAdapterProxy } from './fs-is-accessible-adapter.proxy';

describe('fsIsAccessibleAdapter', () => {
  describe('accessible paths', () => {
    it('VALID: {filePath: "/home/user/config.json"} => returns true', async () => {
      const proxy = fsIsAccessibleAdapterProxy();
      const filePath = FilePathStub({ value: '/home/user/config.json' });

      proxy.resolves();

      const result = await fsIsAccessibleAdapter({ filePath });

      expect(result).toBe(true);
    });
  });

  describe('inaccessible paths', () => {
    it('ERROR: {filePath: "/missing/config.json"} => returns false', async () => {
      const proxy = fsIsAccessibleAdapterProxy();
      const filePath = FilePathStub({ value: '/missing/config.json' });

      proxy.rejects({ error: new Error('ENOENT: no such file or directory') });

      const result = await fsIsAccessibleAdapter({ filePath });

      expect(result).toBe(false);
    });

    it('ERROR: {filePath: "/restricted/config.json"} => returns false on permission error', async () => {
      const proxy = fsIsAccessibleAdapterProxy();
      const filePath = FilePathStub({ value: '/restricted/config.json' });

      proxy.rejects({ error: new Error('EACCES: permission denied') });

      const result = await fsIsAccessibleAdapter({ filePath });

      expect(result).toBe(false);
    });
  });
});
