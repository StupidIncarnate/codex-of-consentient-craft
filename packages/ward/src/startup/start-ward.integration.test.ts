import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { chdir, cwd, stdout } from '#gateway/node/process';

import { wardRunnerHarness } from '../../test/harnesses/ward-runner/ward-runner.harness';
import { WardResultStub } from '../contracts/ward-result/ward-result.stub';

import { StartWard } from './start-ward';

const VALID_RUN_ID = '1739625600000-a3f1';

describe('StartWard', () => {
  const harness = wardRunnerHarness();

  describe('delegation to ward flow', () => {
    it('VALID: {args: ["node", "ward", "unknown-command"]} => completes without throwing for unknown command', async () => {
      await expect(StartWard({ args: ['node', 'ward', 'unknown-command'] })).resolves.toBe(
        undefined,
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

      const originalCwd = cwd();
      chdir(testbed.guildPath);

      let error: unknown;
      try {
        await StartWard({
          args: ['node', 'ward', 'detail', VALID_RUN_ID, 'src/index.ts'],
        });
      } catch (e) {
        error = e;
      } finally {
        chdir(originalCwd);
        testbed.cleanup();
      }

      expect(error).toBe(undefined);
    });

    it('VALID: {args: ["node", "ward", "detail"]} with missing runId => prints usage and completes', async () => {
      await expect(StartWard({ args: ['node', 'ward', 'detail'] })).resolves.toBe(undefined);
    });

    // StartWard resolves rootPath from the gateway's `cwd()`, which only lines up with the
    // testbed directory below because the process really `chdir`ed there — a broker.ts that
    // mis-wired the gateway call would resolve rootPath somewhere else, storageLoadBroker would
    // find no `.ward/run-<id>.json` there, and the run would answer on stderr instead of stdout.
    // Capturing stdout (record-and-swallow, per registerSpyOn's own pattern) and asserting the
    // exact JSON it printed proves cwd() drove the real lookup, not just that nothing threw.
    it('VALID: {args: ["node", "ward", "detail", runId, "--json"], real cwd chdir\'d to the testbed} => prints the stored result read from that exact directory', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'start-ward-detail-json' }),
      });

      const wardResultRelativePath = RelativePathStub({
        value: `.ward/run-${VALID_RUN_ID}.json`,
      });

      const storedResult = WardResultStub();
      testbed.writeFile({
        relativePath: wardResultRelativePath,
        content: FileContentStub({ value: JSON.stringify(storedResult) }),
      });

      const stdoutSpy = registerSpyOn({ object: stdout, method: 'write' });
      stdoutSpy.calledWith([]).returns(true);

      const originalCwd = cwd();
      chdir(testbed.guildPath);

      let error: unknown;
      try {
        await StartWard({
          args: ['node', 'ward', 'detail', VALID_RUN_ID, '--json'],
        });
      } catch (e) {
        error = e;
      } finally {
        chdir(originalCwd);
        testbed.cleanup();
      }

      expect(error).toBe(undefined);

      const [written] = stdoutSpy.callsMatching([]).map((call) => call[0]);
      const printed: unknown = JSON.parse(String(written));

      expect(printed).toStrictEqual({
        runId: storedResult.runId,
        timestamp: storedResult.timestamp,
        checks: storedResult.checks,
      });
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
