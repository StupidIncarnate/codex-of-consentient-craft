import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { createDefaultInstallContextTransformer } from './create-default-install-context-transformer';

describe('createDefaultInstallContextTransformer', () => {
  describe('default context creation', () => {
    it('VALID: {cwd: "/home/user/project"} => returns context with cwd as targetProjectRoot', () => {
      const cwd = FilePathStub({ value: '/home/user/project' });

      const result = createDefaultInstallContextTransformer({ cwd });

      expect(result.targetProjectRoot).toBe('/home/user/project');
    });

    it('VALID: {cwd: "/home/user/project"} => returns context with cwd as dungeonmasterRoot', () => {
      const cwd = FilePathStub({ value: '/home/user/project' });

      const result = createDefaultInstallContextTransformer({ cwd });

      expect(result.dungeonmasterRoot).toBe('/home/user/project');
    });
  });
});
