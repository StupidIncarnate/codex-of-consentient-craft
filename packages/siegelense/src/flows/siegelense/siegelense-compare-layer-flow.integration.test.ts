/**
 * PURPOSE: Drives `SiegelenseCompareLayerFlow` through `compare`'s whole argv surface — `--instance`,
 * `--run-a`, `--run-b` (all required, proven absent in turn and co-required in both directions),
 * `--json`, the `--instance-a`/`--instance-b` cross-instance refusal, an unknown instance and a run
 * with no stored return — against a real evidence tree from `evidenceTreeHarness`, matching how the
 * `compare` cases in `siegelense-flow.integration.test.ts` (the read-path section around
 * `tree.readCompare` and the argv section around `SiegelenseFlow({args: ['compare', ...]})`) drive a
 * real evidence tree with no mocks. `flows/` (this file included) may not import `brokers/` directly —
 * `@dungeonmaster/enforce-import-dependencies` — so `evidenceTreeHarness` is the one door through, and
 * its `readCompare` computes the expected `CompareAnswer` from the SAME real broker the layer flow
 * itself calls, so the assertions below compare two independently-produced reads of the same disk
 * state rather than a hardcoded literal.
 *
 * USAGE:
 * await SiegelenseCompareLayerFlow({
 *   callArgs: ['--instance', 'inst_1111dead', '--run-a', 'run_1', '--run-b', 'run_2'],
 * });
 * // Writes the rendered CompareAnswer for the two real runs the harness wrote to disk
 */

import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { CompareQueryStub } from '../../contracts/compare-query/compare-query.stub';
import { InstanceUnknownError } from '../../errors/instance-unknown/instance-unknown-error';
import { RunMissingError } from '../../errors/run-missing/run-missing-error';
import { compareAnswerRenderTransformer } from '../../transformers/compare-answer-render/compare-answer-render-transformer';
import { evidenceTreeHarness } from '../../../test/harnesses/evidence-tree/evidence-tree.harness';

import { SiegelenseCompareLayerFlow } from './siegelense-compare-layer-flow';

describe('SiegelenseCompareLayerFlow', () => {
  const tree = evidenceTreeHarness();

  describe('the happy path', () => {
    it('VALID: {callArgs: [--instance, <killed>, --run-a, run_1, --run-b, run_2]} => renders the human summary by default', async () => {
      const expectedAnswer = await tree.readCompare({
        query: CompareQueryStub({
          instanceId: tree.killedInstanceId(),
          runA: tree.runOne(),
          runB: tree.runTwo(),
        }),
      });

      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseCompareLayerFlow({
        callArgs: [
          '--instance',
          tree.killedInstanceId(),
          '--run-a',
          tree.runOne(),
          '--run-b',
          tree.runTwo(),
        ],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(wholeOutput).toBe(compareAnswerRenderTransformer({ answer: expectedAnswer }));
    });

    it('VALID: {callArgs: [--instance, <killed>, --run-a, run_1, --run-b, run_2, --json]} => writes the complete CompareAnswer as one JSON document', async () => {
      const expectedAnswer = await tree.readCompare({
        query: CompareQueryStub({
          instanceId: tree.killedInstanceId(),
          runA: tree.runOne(),
          runB: tree.runTwo(),
        }),
      });

      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseCompareLayerFlow({
        callArgs: [
          '--instance',
          tree.killedInstanceId(),
          '--run-a',
          tree.runOne(),
          '--run-b',
          tree.runTwo(),
          '--json',
        ],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual(expectedAnswer);
    });
  });

  describe('the cross-instance refusal', () => {
    it('INVALID: {callArgs: [--instance-a, <killed>, --instance-b, <live>]} => rejects naming both flags and stating there is no cross-instance form', async () => {
      await expect(
        SiegelenseCompareLayerFlow({
          callArgs: [
            '--instance-a',
            tree.killedInstanceId(),
            '--instance-b',
            tree.liveInstanceId(),
          ],
        }),
      ).rejects.toThrow(
        /^--instance-a and --instance-b are not accepted: there is no cross-instance form\. Name one --instance and two runs \(--run-a, --run-b\) inside its own timeline — two different instances share nothing but a spec\.$/u,
      );
    });
  });

  describe('each required flag absent in turn', () => {
    it('INVALID: {callArgs: [--run-a, run_1, --run-b, run_2], no --instance} => rejects naming --instance as required', async () => {
      await expect(
        SiegelenseCompareLayerFlow({
          callArgs: ['--run-a', tree.runOne(), '--run-b', tree.runTwo()],
        }),
      ).rejects.toThrow(/^--instance is required: name the instance both runs belong to\.$/u);
    });

    it('INVALID: {callArgs: [--instance, <killed>, --run-b, run_2], no --run-a} => rejects naming --run-a as required', async () => {
      await expect(
        SiegelenseCompareLayerFlow({
          callArgs: ['--instance', tree.killedInstanceId(), '--run-b', tree.runTwo()],
        }),
      ).rejects.toThrow(/^--run-a is required: name the earlier run in the diff\.$/u);
    });

    it('INVALID: {callArgs: [--instance, <killed>, --run-a, run_1], no --run-b} => rejects naming --run-b as required', async () => {
      await expect(
        SiegelenseCompareLayerFlow({
          callArgs: ['--instance', tree.killedInstanceId(), '--run-a', tree.runOne()],
        }),
      ).rejects.toThrow(/^--run-b is required: name the later run in the diff\.$/u);
    });
  });

  describe('each flag badly shaped', () => {
    it("INVALID: {callArgs: [--instance, not-a-valid-id, --run-a, run_1, --run-b, run_2]} => rejects naming --instance and the contract's own message", async () => {
      await expect(
        SiegelenseCompareLayerFlow({
          callArgs: [
            '--instance',
            'not-a-valid-id',
            '--run-a',
            tree.runOne(),
            '--run-b',
            tree.runTwo(),
          ],
        }),
      ).rejects.toThrow(
        /^--instance: Instance id must look like "inst_" followed by 4 or more lowercase hex characters, e\.g\. "inst_7f3a9c21"$/u,
      );
    });

    it("INVALID: {callArgs: [--instance, <killed>, --run-a, bogus, --run-b, run_2]} => rejects naming --run-a and the contract's own message", async () => {
      await expect(
        SiegelenseCompareLayerFlow({
          callArgs: [
            '--instance',
            tree.killedInstanceId(),
            '--run-a',
            'bogus',
            '--run-b',
            tree.runTwo(),
          ],
        }),
      ).rejects.toThrow(/^--run-a: Invalid$/u);
    });

    it("INVALID: {callArgs: [--instance, <killed>, --run-a, run_1, --run-b, bogus]} => rejects naming --run-b and the contract's own message", async () => {
      await expect(
        SiegelenseCompareLayerFlow({
          callArgs: [
            '--instance',
            tree.killedInstanceId(),
            '--run-a',
            tree.runOne(),
            '--run-b',
            'bogus',
          ],
        }),
      ).rejects.toThrow(/^--run-b: Invalid$/u);
    });
  });

  describe('an unrecognised flag', () => {
    it('INVALID: {callArgs: [--bogus, X]} => rejects naming the flag and listing every accepted one', async () => {
      await expect(SiegelenseCompareLayerFlow({ callArgs: ['--bogus', 'X'] })).rejects.toThrow(
        /^Unknown flag: --bogus\n\nAccepted flags: --instance, --run-a, --run-b, --json\n\nUsage: dungeonmaster siegelense compare --instance <instanceId> --run-a <runId> --run-b <runId> \[--json\]$/u,
      );
    });
  });

  describe('an unknown instance', () => {
    it('ERROR: {callArgs: [--instance, <an id the registry never held>, --run-a, run_1, --run-b, run_2]} => InstanceUnknownError propagates', async () => {
      await expect(
        SiegelenseCompareLayerFlow({
          callArgs: [
            '--instance',
            tree.unknownInstanceId(),
            '--run-a',
            tree.runOne(),
            '--run-b',
            tree.runTwo(),
          ],
        }),
      ).rejects.toThrow(InstanceUnknownError);
    });
  });

  describe('a run with no stored return', () => {
    it('ERROR: {callArgs: [--instance, <killed>, --run-a, run_1, --run-b, run_2], run_2 crashed} => RunMissingError propagates', async () => {
      tree.crashRun2();

      await expect(
        SiegelenseCompareLayerFlow({
          callArgs: [
            '--instance',
            tree.killedInstanceId(),
            '--run-a',
            tree.runOne(),
            '--run-b',
            tree.runTwo(),
          ],
        }),
      ).rejects.toThrow(RunMissingError);
    });
  });
});
