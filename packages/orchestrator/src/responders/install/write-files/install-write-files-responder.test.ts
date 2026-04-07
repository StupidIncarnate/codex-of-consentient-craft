import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallWriteFilesResponderProxy } from './install-write-files-responder.proxy';

describe('InstallWriteFilesResponder', () => {
  describe('return value', () => {
    it('VALID: {context} => returns install result with package name and success', () => {
      const proxy = InstallWriteFilesResponderProxy();

      const result = proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message: 'Agent prompts served via MCP get-agent-prompt tool',
      });
    });
  });
});
