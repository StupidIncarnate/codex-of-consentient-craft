import { osUserHomedirAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';

import { fsReaddirIfExistsAdapterProxy } from '../../../adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';
import { FolderNameStub } from '../../../contracts/folder-name/folder-name.stub';

type PathSegment = ReturnType<typeof PathSegmentStub>;

export const claudeCodeSessionResolveBrokerProxy = (): {
  setupSessionsDir: (params: {
    homedir: string;
    projectDir: string;
    entries: readonly { name: string; mtimeMs: number }[];
  }) => void;
  setupSessionsDirMissing: (params: { homedir: string; projectDir: string }) => void;
} => {
  const homedirProxy = osUserHomedirAdapterProxy();
  const readdirProxy = fsReaddirIfExistsAdapterProxy();
  const statProxy = fsStatAdapterProxy();

  // Mirrors the broker's own sessionsDir computation — a real, unmocked transformer — so the
  // readdir/stat addresses below match what the broker really calls them with.
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
    setupSessionsDir: ({
      homedir,
      projectDir,
      entries,
    }: {
      homedir: string;
      projectDir: string;
      entries: readonly { name: string; mtimeMs: number }[];
    }): void => {
      homedirProxy.returns({ path: homedir });
      const sessionsDir = sessionsDirFor({ homedir, projectDir });
      const folderNames = entries.map((e) => FolderNameStub({ value: e.name }));
      readdirProxy.returns({ filepath: sessionsDir, entries: folderNames });
      for (const entry of entries.filter((e) => e.name.endsWith('.jsonl'))) {
        statProxy.returns({
          filepath: PathSegmentStub({ value: `${String(sessionsDir)}/${entry.name}` }),
          stats: { mtimeMs: entry.mtimeMs },
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
