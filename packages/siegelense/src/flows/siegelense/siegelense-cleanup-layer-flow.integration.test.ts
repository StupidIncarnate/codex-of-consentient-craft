/**
 * PURPOSE: Drives `SiegelenseCleanupLayerFlow` through `cleanup`'s whole argv surface — `--json`
 * versus the rendered default, every refusal `cleanupArgsParseTransformer` makes (`--human`,
 * `--instance`, an unrecognized flag, a positional argument), and the per-kind age-out split —
 * against a real `evidenceTreeHarness` registry carrying a real stale row. `flows/` (and its
 * `.integration.test.ts`) may import neither `brokers/` nor a `.proxy.ts`
 * (`enforce-import-dependencies`, `enforce-test-proxy-imports`), so this reuses `evidenceTreeHarness`
 * — the same harness `siegelense-flow.integration.test.ts`'s own argv-driven `cleanup` cases use —
 * as the one door through to a real registry and a real reap.
 *
 * `assetsAged` stays `{ instances: 0, freedMB: 0 }` for the bare-call and `--json` cases: nothing
 * evidenceTreeHarness's own tree writes is old enough to select under either of cleanup's windows.
 * The per-kind split itself — a `.webm` ageing out on the shorter 2d video window while a `.png`
 * survives the longer 7d shared one, IN ONE sweep — is proven separately below on real files, real
 * mtimes and a real `evidenceAgeHarness` backdate: `assets-age-layer-broker.test.ts:45-101` proves
 * the same rule against a mocked `modifiedAtMs`, and this is that rule read back off disk.
 *
 * USAGE:
 * await SiegelenseCleanupLayerFlow({ callArgs: ['--json'] });
 * // Reaps every stale registry row, releases its ports, and returns the CleanupAnswer as JSON
 */

import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { evidenceAgeHarness } from '../../../test/harnesses/evidence-age/evidence-age.harness';
import { evidenceTreeHarness } from '../../../test/harnesses/evidence-tree/evidence-tree.harness';
import { SiegelenseCleanupLayerFlow } from './siegelense-cleanup-layer-flow';

const DAY_MS = 86_400_000;

describe('SiegelenseCleanupLayerFlow', () => {
  const tree = evidenceTreeHarness();
  const age = evidenceAgeHarness();

  describe('the bare call', () => {
    it('VALID: {callArgs: []} => renders the human summary, reaping a real stale row and leaving the live one alone', async () => {
      const staleId = await tree.addStaleAliveEntry();

      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseCleanupLayerFlow({ callArgs: [] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(wholeOutput).toMatch(
        new RegExp(
          `^REAPED: ${staleId} \\(stale \\d+m, killed ${tree.fakePgid()}, home removed\\)\\n` +
            'PORTS RELEASED: 40021, 40022\\n' +
            'LOCK RELEASED: no\\n' +
            'ASSETS AGED: 0 instances, 0MB\\n' +
            `LEFT ALONE: ${tree.liveInstanceId()} \\(live — last beat \\d+s ago\\)\\n$`,
          'u',
        ),
      );
    });
  });

  describe('--json', () => {
    it('VALID: {callArgs: [--json]} => a real stale registry row reaped, a real live row left alone, as JSON', async () => {
      const staleId = await tree.addStaleAliveEntry();

      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseCleanupLayerFlow({ callArgs: ['--json'] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual({
        reaped: [
          {
            id: staleId,
            staleFor: expect.stringMatching(/^\d+m$/u),
            killed: [tree.fakePgid()],
            homeRemoved: true,
          },
        ],
        portsReleased: [40_021, 40_022],
        lockReleased: false,
        assetsAged: { instances: 0, freedMB: 0 },
        leftAlone: [
          {
            id: tree.liveInstanceId(),
            why: expect.stringMatching(/^live — last beat \d+s ago$/u),
          },
        ],
      });

      const registryAfter = await tree.readRegistry();
      const staleRowAfter = registryAfter.instances.find((entry) => entry.id === staleId);
      const liveRowAfter = registryAfter.instances.find(
        (entry) => entry.id === tree.liveInstanceId(),
      );
      const killedRowAfter = registryAfter.instances.find(
        (entry) => entry.id === tree.killedInstanceId(),
      );

      expect(staleRowAfter?.state).toBe('killed');
      expect(staleRowAfter?.pid).toBe(null);
      expect(staleRowAfter?.pgids).toStrictEqual([]);
      expect(staleRowAfter?.socketPath).toBe(null);
      expect(liveRowAfter?.state).toBe('alive');
      expect(killedRowAfter?.state).toBe('killed');
    });
  });

  describe('the per-kind age window, on a real boundary', () => {
    it('VALID: {a .webm and a .png both backdated 3 days, one cleanup sweep} => the video ages out on its shorter 2d window while the shot survives the shared 7d one', async () => {
      const { videoPath, shotPath } = await age.seedAgingInstance({ daysOld: 3 });

      const videoMtimeAfterBackdate = await age.mtimeMs({ filePath: videoPath });
      const shotMtimeAfterBackdate = await age.mtimeMs({ filePath: shotPath });
      const videoAgeMs = Date.now() - Number(videoMtimeAfterBackdate);
      const shotAgeMs = Date.now() - Number(shotMtimeAfterBackdate);

      await SiegelenseCleanupLayerFlow({ callArgs: [] });

      const videoSurvives = age.exists({ filePath: videoPath });
      const shotSurvives = age.exists({ filePath: shotPath });

      expect(videoAgeMs).toBeGreaterThan(DAY_MS * 2.5);
      expect(videoAgeMs).toBeLessThan(DAY_MS * 3.5);
      expect(shotAgeMs).toBeGreaterThan(DAY_MS * 2.5);
      expect(shotAgeMs).toBeLessThan(DAY_MS * 3.5);
      expect(videoSurvives).toBe(false);
      expect(shotSurvives).toBe(true);
    });
  });

  describe('refusals cleanupArgsParseTransformer makes', () => {
    it('INVALID: {callArgs: [--human]} => rejects --human as an unknown flag', async () => {
      await expect(SiegelenseCleanupLayerFlow({ callArgs: ['--human'] })).rejects.toThrow(
        /^Unknown flag: --human/u,
      );
    });

    it('INVALID: {callArgs: [--instance, inst_1234]} => rejects --instance as an unknown flag', async () => {
      await expect(
        SiegelenseCleanupLayerFlow({ callArgs: ['--instance', 'inst_1234'] }),
      ).rejects.toThrow(/^Unknown flag: --instance/u);
    });

    it('INVALID: {callArgs: [--bogus]} => rejects an unrecognized flag by name', async () => {
      await expect(SiegelenseCleanupLayerFlow({ callArgs: ['--bogus'] })).rejects.toThrow(
        /^Unknown flag: --bogus/u,
      );
    });

    it('INVALID: {callArgs: [inst_1234]} => rejects a bare positional argument', async () => {
      await expect(SiegelenseCleanupLayerFlow({ callArgs: ['inst_1234'] })).rejects.toThrow(
        /^Unexpected positional argument: inst_1234/u,
      );
    });
  });
});
