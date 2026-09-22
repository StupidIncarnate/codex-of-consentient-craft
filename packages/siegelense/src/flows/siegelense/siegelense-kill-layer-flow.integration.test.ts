import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { KillResultStub } from '../../contracts/kill-result/kill-result.stub';
import { RepoLocalPathStub } from '../../contracts/repo-local-path/repo-local-path.stub';
import { ResultsQueryStub } from '../../contracts/results-query/results-query.stub';
import { InstanceUnknownError } from '../../errors/instance-unknown/instance-unknown-error';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { killAnswerRenderTransformer } from '../../transformers/kill-answer-render/kill-answer-render-transformer';
import { evidenceTreeHarness } from '../../../test/harnesses/evidence-tree/evidence-tree.harness';
import { SiegelenseKillLayerFlow } from './siegelense-kill-layer-flow';

// `start` and `run` need a live driver process and get no flow-level integration test for that
// reason (siegelense-flow.integration.test.ts:836-843). `kill` does not: `instanceKillBroker`
// ALWAYS tries the driver socket first, and in this suite — same as a real session where the
// driver already died — nothing is listening on it, so every case here drives the REAL orphan-reap
// path (instance-kill-broker.ts:75-135) rather than a fabricated one. The one branch this suite
// cannot reach honestly is the driver actually ANSWERING the kill request over a live socket —
// that needs a real spawned driver process, which is exactly the live-process dependency this file
// is deliberately avoiding.
describe('SiegelenseKillLayerFlow', () => {
  const tree = evidenceTreeHarness();

  describe('the required --instance flag', () => {
    it('INVALID: {callArgs: []} => refuses naming --instance as required', async () => {
      await expect(SiegelenseKillLayerFlow({ callArgs: [] })).rejects.toThrow(
        /^--instance is required: kill needs an instance id to tear down\.\n\nUsage: dungeonmaster siegelense kill --instance <instanceId> \[--json\]$/u,
      );
    });

    it('INVALID: {callArgs: [--instance, not-a-valid-id]} => refuses the shape naming --instance rather than a raw ZodError', async () => {
      await expect(
        SiegelenseKillLayerFlow({ callArgs: ['--instance', 'not-a-valid-id'] }),
      ).rejects.toThrow(
        /^--instance: Instance id must look like "inst_" followed by 4 or more lowercase hex characters, e\.g\. "inst_7f3a9c21"$/u,
      );
    });
  });

  describe('an id the registry never held', () => {
    it('ERROR: {callArgs: [--instance, <unknown id>]} => throws InstanceUnknownError', async () => {
      await expect(
        SiegelenseKillLayerFlow({ callArgs: ['--instance', tree.unknownInstanceId()] }),
      ).rejects.toStrictEqual(new InstanceUnknownError({ instanceId: tree.unknownInstanceId() }));
    });
  });

  describe('a known but already-dead id', () => {
    it('VALID: {callArgs: [--instance, <killed>, --json]} => accepts the dead id and writes the complete KillResult as JSON', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      const flowResult = await SiegelenseKillLayerFlow({
        callArgs: ['--instance', tree.killedInstanceId(), '--json'],
      });

      process.stdout.write = originalWrite;

      const expectedResult = KillResultStub({
        instanceId: tree.killedInstanceId(),
        portsReleased: [40_001, 40_002],
        homeRemoved: true,
        evidenceKept: RepoLocalPathStub({
          path: tree.killedInstanceEvidenceDir(),
          linkPresent: false,
        }),
        reapedPgids: [],
      });

      expect(writes).toStrictEqual([
        `${JSON.stringify(expectedResult, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
      expect(flowResult).toStrictEqual({ success: true });
    });

    it('VALID: {callArgs: [--instance, <killed>]} => writes the rendered human summary by default', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseKillLayerFlow({ callArgs: ['--instance', tree.killedInstanceId()] });

      process.stdout.write = originalWrite;

      const expectedResult = KillResultStub({
        instanceId: tree.killedInstanceId(),
        portsReleased: [40_001, 40_002],
        homeRemoved: true,
        evidenceKept: RepoLocalPathStub({
          path: tree.killedInstanceEvidenceDir(),
          linkPresent: false,
        }),
        reapedPgids: [],
      });

      expect(writes).toStrictEqual([killAnswerRenderTransformer({ result: expectedResult })]);
    });

    // packages/siegelense/CLAUDE.md: "kill removes the throwaway home and never the evidence
    // directory". The throwaway home lives outside this suite's reach (a bare tmpdir path this
    // package never exposes a reader for), but the evidence directory's own content is: run_1's
    // transcript and stored return stay on disk and readable through the exact same real
    // `resultsReadBroker` call, before AND after kill runs against this instance.
    it('VALID: {callArgs: [--instance, <killed>]} => the evidence directory survives — run_1 reads identically before and after', async () => {
      const query = ResultsQueryStub({ instanceId: tree.killedInstanceId(), runId: tree.runOne() });
      const beforeAnswer = await tree.readResults({ query });

      await SiegelenseKillLayerFlow({ callArgs: ['--instance', tree.killedInstanceId()] });

      const afterAnswer = await tree.readResults({ query });

      expect(afterAnswer).toStrictEqual(beforeAnswer);
    });
  });

  describe('a known, alive id', () => {
    it('VALID: {callArgs: [--instance, <alive>]} => accepts it, tearing the registry row down to killed', async () => {
      await SiegelenseKillLayerFlow({ callArgs: ['--instance', tree.liveInstanceId()] });

      const registryAfter = await tree.readRegistry();
      const entryAfter = registryAfter.instances.find(
        (entry) => entry.id === tree.liveInstanceId(),
      );

      expect(entryAfter?.state).toBe('killed');
      expect(entryAfter?.pid).toBe(null);
      expect(entryAfter?.pgids).toStrictEqual([]);
      expect(entryAfter?.socketPath).toBe(null);
    });
  });
});
