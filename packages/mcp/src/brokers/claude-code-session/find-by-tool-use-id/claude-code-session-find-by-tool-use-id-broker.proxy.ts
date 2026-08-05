import { osUserHomedirAdapterProxy } from '@dungeonmaster/shared/testing';
import {
  AbsoluteFilePathStub,
  FileContentsStub,
  PathSegmentStub,
} from '@dungeonmaster/shared/contracts';
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsReaddirIfExistsAdapterProxy } from '../../../adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter.proxy';
import { FolderNameStub } from '../../../contracts/folder-name/folder-name.stub';

type PathSegment = ReturnType<typeof PathSegmentStub>;

export const claudeCodeSessionFindByToolUseIdBrokerProxy = (): {
  setupSessions: (params: {
    homedir: string;
    projectDir: string;
    sessions: readonly { name: string; contents: string }[];
  }) => void;
  setupSessionsDirMissing: (params: { homedir: string; projectDir: string }) => void;
} => {
  const homedirProxy = osUserHomedirAdapterProxy();
  const readdirProxy = fsReaddirIfExistsAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  // Mirrors the broker's own sessionsDir computation — a real, unmocked transformer — so the
  // readdir/readFile addresses below match what the broker really calls them with.
  const sessionsDirFor = ({
    homedir,
    projectDir,
  }: {
    homedir: string;
    projectDir: string;
  }): PathSegment =>
    PathSegmentStub({
      value: String(
        claudePathSlugEncoderTransformer({
          homeDir: AbsoluteFilePathStub({ value: homedir }),
          projectPath: AbsoluteFilePathStub({ value: projectDir }),
        }),
      ),
    });

  return {
    setupSessions: ({
      homedir,
      projectDir,
      sessions,
    }: {
      homedir: string;
      projectDir: string;
      sessions: readonly { name: string; contents: string }[];
    }): void => {
      homedirProxy.returns({ path: homedir });
      const sessionsDir = sessionsDirFor({ homedir, projectDir });
      readdirProxy.returns({
        filepath: sessionsDir,
        entries: sessions.map((session) => FolderNameStub({ value: session.name })),
      });
      for (const session of sessions) {
        readFileProxy.returnsFor({
          filepath: PathSegmentStub({ value: `${String(sessionsDir)}/${session.name}` }),
          contents: FileContentsStub({ value: session.contents }),
        });
      }
    },
    setupSessionsDirMissing: ({
      homedir,
      projectDir,
    }: {
      homedir: string;
      projectDir: string;
    }): void => {
      homedirProxy.returns({ path: homedir });
      readdirProxy.returnsUndefined({ filepath: sessionsDirFor({ homedir, projectDir }) });
    },
  };
};
