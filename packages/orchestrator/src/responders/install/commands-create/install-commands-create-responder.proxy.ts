import { fsMkdirAdapterProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { slashCommandsStatics } from '../../../statics/slash-commands/slash-commands-statics';
import { InstallCommandsCreateResponder } from './install-commands-create-responder';

export const InstallCommandsCreateResponderProxy = (): {
  callResponder: typeof InstallCommandsCreateResponder;
  getCreatedDirs: () => readonly unknown[];
  getAllWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  pathJoinAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  // Every caller exercises targetProjectRoot: '/project' (the real, unstaged pathJoin
  // passthrough resolves it to this exact commands dir), so the three command files this
  // responder writes always land at these fixed paths.
  const commandsDir = '/project/.claude/commands';
  writeProxy.succeeds({
    filePath: FilePathStub({
      value: `${commandsDir}/${slashCommandsStatics.dumpsterCreate.fileName}`,
    }),
  });
  writeProxy.succeeds({
    filePath: FilePathStub({
      value: `${commandsDir}/${slashCommandsStatics.dumpsterHunt.fileName}`,
    }),
  });
  writeProxy.succeeds({
    filePath: FilePathStub({
      value: `${commandsDir}/${slashCommandsStatics.dumpsterLaunch.fileName}`,
    }),
  });

  return {
    callResponder: InstallCommandsCreateResponder,
    getCreatedDirs: (): readonly unknown[] => mkdirProxy.getCreatedDirs(),
    getAllWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getAllWrittenFiles(),
  };
};
