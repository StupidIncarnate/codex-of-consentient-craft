import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { slashCommandsStatics } from '../../../statics/slash-commands/slash-commands-statics';
import { InstallCommandsCreateResponderProxy } from './install-commands-create-responder.proxy';

describe('InstallCommandsCreateResponder', () => {
  describe('return value', () => {
    it('VALID: {context} => returns install result with created action', async () => {
      const proxy = InstallCommandsCreateResponderProxy();

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message:
          'Created .claude/commands/dumpster-create.md, .claude/commands/dumpster-hunt.md, and .claude/commands/dumpster-launch.md',
      });
    });
  });

  describe('directory creation', () => {
    it('VALID: {context} => creates the .claude/commands directory under targetProjectRoot', async () => {
      const proxy = InstallCommandsCreateResponderProxy();

      await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(proxy.getCreatedDirs()).toStrictEqual(['/project/.claude/commands']);
    });
  });

  describe('file writes', () => {
    it('VALID: {context} => writes dumpster-create.md, dumpster-hunt.md, and dumpster-launch.md with verbatim statics bodies', async () => {
      const proxy = InstallCommandsCreateResponderProxy();

      await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(proxy.getAllWrittenFiles()).toStrictEqual([
        {
          path: '/project/.claude/commands/dumpster-create.md',
          content: slashCommandsStatics.dumpsterCreate.body,
        },
        {
          path: '/project/.claude/commands/dumpster-hunt.md',
          content: slashCommandsStatics.dumpsterHunt.body,
        },
        {
          path: '/project/.claude/commands/dumpster-launch.md',
          content: slashCommandsStatics.dumpsterLaunch.body,
        },
      ]);
    });
  });
});
