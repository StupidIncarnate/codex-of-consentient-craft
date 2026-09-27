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

  // The broker's own existsSync call has no try/catch around it (unlike its readdir/read-file
  // calls, which do), and the gateway's existsSyncProxy stages no default — so a subpath set up
  // with no barrelContent (the "directory exists, barrel file does not" case below) needs this
  // fallback, matching real fs.existsSync's own "false on anything unresolved" semantics. There is
  // no known path to key on here (any subpath's barrel could be the unstaged one), so an
  // always-true predicate is the explicit "answer any call" stage; setupSubpath's own path-exact
  // `.returns()` below is more specific and always outranks it.
  existsProxy.returnsMatchingPath({ path: (): boolean => true, exists: false });

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

      if (barrelContent !== undefined) {
        const barrelPath = AbsoluteFilePathStub({
          value: `${String(folderSrcPath)}/${subpathName}/${subpathName}.ts`,
        });
        existsProxy.returns({ path: barrelPath, exists: true });
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
