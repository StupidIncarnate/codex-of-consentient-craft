/**
 * Drives the sync against a REAL directory tree, because the defect it pins is one the unit tests
 * cannot see: every case in `project-references-sync-broker.test.ts` stages a root tsconfig that
 * parses, so none of them exercises the fallback that fires when one does not.
 *
 * `tsc --init` emits a tsconfig WITH `//` comments. `JSON.parse` rejects those. For a PACKAGE
 * config the parse failure makes it ineligible and it is skipped, which is safe. The ROOT config
 * has no eligibility test, so the failure falls through to `?? {}` and the file is rewritten from
 * that empty object — the reader's `strict`, `target` and `paths` are gone, announced as one line
 * on stderr. Ward is published, so this happens in repos nobody here has seen.
 */

import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { projectReferencesSyncBroker } from './project-references-sync-broker';

const ROOT_TSCONFIG = RelativePathStub({ value: 'tsconfig.json' });

// What `tsc --init` produces: valid JSONC, invalid JSON.
const COMMENTED_ROOT_TSCONFIG = `{
  // Root config for this repo. Every package extends it.
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "paths": {
      "@app/*": ["./packages/*/src"]
    }
  }
}
`;

describe('projectReferencesSyncBroker() against a real tree', () => {
  describe('a root tsconfig.json that JSON.parse rejects', () => {
    it('VALID: {root tsconfig carries // comments} => leaves the file byte-identical', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'ward-consumer-root-tsconfig' }),
      });

      testbed.writeFile({
        relativePath: ROOT_TSCONFIG,
        content: FileContentStub({ value: COMMENTED_ROOT_TSCONFIG }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'packages/app/package.json' }),
        content: FileContentStub({ value: '{"name":"@app/app","dependencies":{}}' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'packages/app/tsconfig.json' }),
        content: FileContentStub({ value: '{"compilerOptions":{"composite":true}}' }),
      });

      await projectReferencesSyncBroker({
        rootPath: AbsoluteFilePathStub({ value: testbed.guildPath }),
        projectFolders: [
          ProjectFolderStub({ name: 'app', path: `${String(testbed.guildPath)}/packages/app` }),
        ],
      });

      const afterSync = testbed.readFile({ relativePath: ROOT_TSCONFIG });
      testbed.cleanup();

      expect(afterSync).toBe(COMMENTED_ROOT_TSCONFIG);
    });
  });

  describe('a repo with no root tsconfig.json at all', () => {
    it('VALID: {no root tsconfig} => creates none', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'ward-consumer-no-root-tsconfig' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'packages/app/package.json' }),
        content: FileContentStub({ value: '{"name":"@app/app","dependencies":{}}' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'packages/app/tsconfig.json' }),
        content: FileContentStub({ value: '{"compilerOptions":{"composite":true}}' }),
      });

      await projectReferencesSyncBroker({
        rootPath: AbsoluteFilePathStub({ value: testbed.guildPath }),
        projectFolders: [
          ProjectFolderStub({ name: 'app', path: `${String(testbed.guildPath)}/packages/app` }),
        ],
      });

      const afterSync = testbed.readFile({ relativePath: ROOT_TSCONFIG });
      testbed.cleanup();

      expect(afterSync).toBe(null);
    });
  });
});
