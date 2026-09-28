import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { join } from '#gateway/node/path';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { slashCommandsStatics } from '../../../statics/slash-commands/slash-commands-statics';
import { InstallCommandsCreateResponder } from './install-commands-create-responder';

export const InstallCommandsCreateResponderProxy = (): {
  callResponder: typeof InstallCommandsCreateResponder;
  getCreatedDirs: () => readonly unknown[];
  getAllWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  const joinHandle = registerMock({ fn: join });
  const mkdirProxy = ensureDirProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  // Every caller exercises targetProjectRoot: '/project', so the exact join tuples below are the
  // only ones this responder ever composes and the two command files always land here.
  const targetProjectRoot = '/project';
  const commandsDir = FilePathStub({ value: `${targetProjectRoot}/.claude/commands` });
  joinHandle
    .calledWith([targetProjectRoot, locationsStatics.repoRoot.claude.dir, 'commands'])
    .returns(commandsDir);
  mkdirProxy.succeeds({ path: commandsDir });

  const createPath = FilePathStub({
    value: `${commandsDir}/${slashCommandsStatics.dumpsterCreate.fileName}`,
  });
  const huntPath = FilePathStub({
    value: `${commandsDir}/${slashCommandsStatics.dumpsterHunt.fileName}`,
  });
  joinHandle
    .calledWith([commandsDir, slashCommandsStatics.dumpsterCreate.fileName])
    .returns(createPath);
  joinHandle
    .calledWith([commandsDir, slashCommandsStatics.dumpsterHunt.fileName])
    .returns(huntPath);

  writeProxy.succeeds({ filePath: createPath });
  writeProxy.succeeds({ filePath: huntPath });

  return {
    callResponder: InstallCommandsCreateResponder,
    getCreatedDirs: (): readonly unknown[] =>
      mkdirProxy.getCallsFor({ path: commandsDir }).map((call) => call[0]),
    getAllWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getAllWrittenFiles(),
  };
};
