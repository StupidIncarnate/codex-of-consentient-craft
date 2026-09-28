import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import type { DirEntrySync } from '#gateway/node/fs';
import { gatewayLintConfigReadBrokerProxy } from '../../gateway-lint-config/read/gateway-lint-config-read-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const makeDirEntry = ({ name }: { name: string }): DirEntrySync => ({ name, kind: 'directory' });

export const architectureGatewayInventoryBrokerProxy = (): {
  setupSubpath: ({
    projectRoot,
    folder,
    subpathName,
    barrelContent,
  }: {
    projectRoot: AbsoluteFilePath;
    folder: string;
    subpathName: string;
    barrelContent?: ContentText;
  }) => void;
  setupGatewayLintConfig: ({
    repoRoot,
    fileContent,
  }: {
    repoRoot: AbsoluteFilePath;
    fileContent: ContentText;
  }) => void;
} => {
  const readdirProxy = readdirEntriesSyncProxy();
  const existsProxy = existsSyncProxy();
  const readProxy = readFileSyncProxy();
  const lintConfigProxy = gatewayLintConfigReadBrokerProxy();

  // The broker unconditionally composes gatewayLintConfigReadBroker, which checks its own
  // `.dungeonmaster.json` existsSync every call, for whatever projectRoot the test passes to the
  // BROKER directly (a value this proxy's constructor never sees). A predicate pinned to the one
  // known filename shape — never a bare accept-all — answers that check "missing" by default;
  // setupGatewayLintConfig's own exact-path `.returns()` always outranks it for the one scenario
  // that supplies a real file, since an exact match is more specific than a predicate match.
  const DUNGEONMASTER_CONFIG_FILENAME = '.dungeonmaster.json';
  existsProxy.returnsMatchingPath({
    path: (value: unknown): boolean =>
      typeof value === 'string' && value.endsWith(DUNGEONMASTER_CONFIG_FILENAME),
    exists: false,
  });

  const entriesByFolderSrcPath = new Map<ContentText, DirEntrySync[]>();

  return {
    setupSubpath: ({
      projectRoot,
      folder,
      subpathName,
      barrelContent,
    }: {
      projectRoot: AbsoluteFilePath;
      folder: string;
      subpathName: string;
      barrelContent?: ContentText;
    }): void => {
      const folderSrcPath = AbsoluteFilePathStub({
        value: `${String(projectRoot)}/packages/@gateway/${folder}/src`,
      });
      const folderSrcPathKey = ContentTextStub({ value: String(folderSrcPath) });

      const existingEntries = entriesByFolderSrcPath.get(folderSrcPathKey) ?? [];
      const entries = [...existingEntries, makeDirEntry({ name: subpathName })];
      entriesByFolderSrcPath.set(folderSrcPathKey, entries);
      readdirProxy.returns({ path: folderSrcPath, entries });

      // The broker's own existsSync call has no try/catch around it (unlike its readdir/read-file
      // calls, which do), so every subpath this proxy describes stages an exact true-or-false
      // answer for its own barrel path — "directory exists, barrel file does not" is exists: false,
      // never an unstaged call.
      const barrelPath = AbsoluteFilePathStub({
        value: `${String(folderSrcPath)}/${subpathName}/${subpathName}.ts`,
      });
      existsProxy.returns({ path: barrelPath, exists: barrelContent !== undefined });
      if (barrelContent !== undefined) {
        readProxy.returns({ path: barrelPath, contents: barrelContent });
      }
    },

    setupGatewayLintConfig: ({
      repoRoot,
      fileContent,
    }: {
      repoRoot: AbsoluteFilePath;
      fileContent: ContentText;
    }): void => {
      lintConfigProxy.setupConfig({
        configPath: AbsoluteFilePathStub({ value: `${String(repoRoot)}/.dungeonmaster.json` }),
        fileContent,
      });
    },
  };
};
