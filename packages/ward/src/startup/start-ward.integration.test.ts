import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';

import { wardRunnerHarness } from '../../test/harnesses/ward-runner/ward-runner.harness';
import { WardResultStub } from '../contracts/ward-result/ward-result.stub';

import { StartWard } from './start-ward';

const VALID_RUN_ID = '1739625600000-a3f1';

describe('StartWard', () => {
  const harness = wardRunnerHarness();

  describe('delegation to ward flow', () => {
    it('VALID: {args: ["node", "ward", "unknown-command"]} => completes without throwing for unknown command', async () => {
      await expect(StartWard({ args: ['node', 'ward', 'unknown-command'] })).resolves.toStrictEqual(
        { success: true },
      );
    });
  });

  describe('detail subcommand', () => {
    it('VALID: {args: ["node", "ward", "detail", runId, filePath]} => completes without throwing', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'start-ward-detail' }),
      });

      const wardResultRelativePath = RelativePathStub({
        value: `.ward/run-${VALID_RUN_ID}.json`,
      });

      testbed.writeFile({
        relativePath: wardResultRelativePath,
        content: FileContentStub({ value: JSON.stringify(WardResultStub()) }),
      });

      const originalCwd = process.cwd();
      process.chdir(testbed.guildPath);

      let error: unknown;
      try {
        await StartWard({
          args: ['node', 'ward', 'detail', VALID_RUN_ID, 'src/index.ts'],
        });
      } catch (e) {
        error = e;
      } finally {
        process.chdir(originalCwd);
        testbed.cleanup();
      }

      expect(error).toBe(undefined);
    });

    it('VALID: {args: ["node", "ward", "detail"]} with missing runId => prints usage and completes', async () => {
      await expect(StartWard({ args: ['node', 'ward', 'detail'] })).resolves.toStrictEqual({
        success: true,
      });
    });

    it('VALID: {args: ["node", "ward", "detail", runId, "--json"]} => completes without throwing', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'start-ward-detail-json' }),
      });

      const wardResultRelativePath = RelativePathStub({
        value: `.ward/run-${VALID_RUN_ID}.json`,
      });

      testbed.writeFile({
        relativePath: wardResultRelativePath,
        content: FileContentStub({ value: JSON.stringify(WardResultStub()) }),
      });

      const originalCwd = process.cwd();
      process.chdir(testbed.guildPath);

      let error: unknown;
      try {
        await StartWard({
          args: ['node', 'ward', 'detail', VALID_RUN_ID, '--json'],
        });
      } catch (e) {
        error = e;
      } finally {
        process.chdir(originalCwd);
        testbed.cleanup();
      }

      expect(error).toBe(undefined);
    });
  });

  describe('built artifact', () => {
    it('VALID: {built ward package} => the bin entry exists on disk', () => {
      // This is the package's one "the build produced a runnable binary" assertion, and it
      // deliberately reads dist/. `npm run build` is its prerequisite; run it before this test or
      // it fails on a clean checkout even though nothing here is broken.
      expect(harness.wardBinExists()).toBe(true);
    });
  });
});
