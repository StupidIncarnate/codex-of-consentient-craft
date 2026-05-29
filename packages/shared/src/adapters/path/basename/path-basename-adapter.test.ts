import { pathBasenameAdapter } from './path-basename-adapter';
import { pathBasenameAdapterProxy } from './path-basename-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('pathBasenameAdapter', () => {
  describe('absolute paths', () => {
    it('VALID: {path: "/home/user/projects/codex-of-consentient-craft"} => returns "codex-of-consentient-craft"', () => {
      pathBasenameAdapterProxy();
      const path = FilePathStub({ value: '/home/user/projects/codex-of-consentient-craft' });

      const result = pathBasenameAdapter({ path });

      expect(result).toBe('codex-of-consentient-craft');
    });

    it('EDGE: {path: "/home/user/projects/codex-of-consentient-craft/"} => returns "codex-of-consentient-craft"', () => {
      pathBasenameAdapterProxy();
      const path = FilePathStub({ value: '/home/user/projects/codex-of-consentient-craft/' });

      const result = pathBasenameAdapter({ path });

      expect(result).toBe('codex-of-consentient-craft');
    });
  });

  describe('relative paths', () => {
    it('VALID: {path: "./singlefolder"} => returns "singlefolder"', () => {
      pathBasenameAdapterProxy();
      const path = FilePathStub({ value: './singlefolder' });

      const result = pathBasenameAdapter({ path });

      expect(result).toBe('singlefolder');
    });
  });
});
