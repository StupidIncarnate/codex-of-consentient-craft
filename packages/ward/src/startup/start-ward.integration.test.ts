import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';

import { wardRunnerHarness } from '../../test/harnesses/ward-runner/ward-runner.harness';
import { WardResultStub } from '../contracts/ward-result/ward-result.stub';

import { StartWard } from './start-ward';

const MAX_RSS_KB = 307_200;
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

  describe('memory ceiling', () => {
    it('EDGE: {--only lint, all packages} => RSS stays under 300MB', async () => {
      expect(harness.wardBinExists()).toBe(true);

      const { maxRssKb } = await harness.runAndMonitorMemory({
        args: ['run', '--only', 'lint'],
      });

      expect(maxRssKb).toBeLessThan(MAX_RSS_KB);
    }, 60_000); // TIMEBOUND: runAndMonitorMemory spawns ward process with 30s timeout + polling
  });
});
