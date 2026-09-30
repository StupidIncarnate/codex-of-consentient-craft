import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { slashCommandsStatics } from '../../../statics/slash-commands/slash-commands-statics';
import { InstallCommandsCreateResponder } from './install-commands-create-responder';

export const InstallCommandsCreateResponderProxy = (): {
  callResponder: typeof InstallCommandsCreateResponder;
  getCreatedDirs: () => readonly unknown[];
  getAllWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  const joinHandle = registerMock({ fn: join });
  const mkdirProxy = ensureDirProxy();
  const writeProxy = writeFileProxy();

  // Every caller exercises targetProjectRoot: '/project', so the exact join tuples below are the
  // only ones this responder ever composes and the two command files always land here.
  const targetProjectRoot = '/project';
  const commandsDir = `${targetProjectRoot}/.claude/commands`;
  joinHandle
    .calledWith([targetProjectRoot, locationsStatics.repoRoot.claude.dir, 'commands'])
    .returns(commandsDir);
  mkdirProxy.succeeds({ path: commandsDir });

  const createPath = `${commandsDir}/${slashCommandsStatics.dumpsterCreate.fileName}`;
  const huntPath = `${commandsDir}/${slashCommandsStatics.dumpsterHunt.fileName}`;
  joinHandle
    .calledWith([commandsDir, slashCommandsStatics.dumpsterCreate.fileName])
    .returns(createPath);
  joinHandle
    .calledWith([commandsDir, slashCommandsStatics.dumpsterHunt.fileName])
    .returns(huntPath);

  writeProxy.succeeds({ path: createPath });
  writeProxy.succeeds({ path: huntPath });

  return {
    callResponder: InstallCommandsCreateResponder,
    getCreatedDirs: (): readonly unknown[] =>
      mkdirProxy.getCallsFor({ path: commandsDir }).map((call) => call[0]),
    getAllWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      [createPath, huntPath].flatMap((path) =>
        writeProxy.getCallsFor({ path }).map((call) => ({ path: call[0], content: call[1] })),
      ),
  };
};
