/**
 * PURPOSE: Drives `SiegelenseResultsLayerFlow` through `results`'s whole argv surface — the widest
 * flag set of the thirteen calls — against a real `evidenceTreeHarness` tree, the same evidence-on-
 * disk substrate `siegelense-flow.integration.test.ts`'s own `results` cases use (`results` starts
 * nothing and reads only from disk, per `siegelense/CLAUDE.md`'s "Evidence reads go to DISK" rule).
 * `flows/` may import neither a `.proxy.ts` file (`enforce-test-proxy-imports`) nor `brokers/`
 * directly (`enforce-import-dependencies`), so every assertion goes through the harness's
 * `readResults` door onto the real `resultsReadBroker`, exactly as
 * `siegelense-flow.integration.test.ts`'s own "every built call, through argv" section does: each
 * case builds a `ResultsQuery` by hand for the SAME scenario the argv line describes, reads that
 * query directly off the tree for the expected answer, then drives the identical scenario through
 * `SiegelenseResultsLayerFlow({ callArgs })` and compares the two — proving the argv PARSE produces
 * the query it should, not re-proving the broker's own filtering (that is
 * `results-read-broker.test.ts`'s job).
 *
 * USAGE:
 * await SiegelenseResultsLayerFlow({
 *   callArgs: ['--instance', 'inst_1111dead', '--run', 'run_1', '--kind', 'console', '--json'],
 * });
 * // Writes the ResultsAnswer as raw JSON to stdout
 */

import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { ResultFieldStub } from '../../contracts/result-field/result-field.stub';
import { ResultsQueryStub } from '../../contracts/results-query/results-query.stub';
import { ResultWhereStub } from '../../contracts/result-where/result-where.stub';
import { StepIndexStub } from '../../contracts/step-index/step-index.stub';
import { RunIdRequiredError } from '../../errors/run-id-required/run-id-required-error';
import { resultRowProjectTransformer } from '../../transformers/result-row-project/result-row-project-transformer';
import { resultsAnswerRenderTransformer } from '../../transformers/results-answer-render/results-answer-render-transformer';
import { evidenceTreeHarness } from '../../../test/harnesses/evidence-tree/evidence-tree.harness';
import { SiegelenseResultsLayerFlow } from './siegelense-results-layer-flow';

describe('SiegelenseResultsLayerFlow', () => {
  const tree = evidenceTreeHarness();

  describe('the --instance flag — required', () => {
    it('INVALID: {callArgs: []} => rejects naming --instance rather than defaulting to any tracked instance', async () => {
      await expect(SiegelenseResultsLayerFlow({ callArgs: [] })).rejects.toThrow(
        /^--instance is required: name the instance to read evidence from\.$/u,
      );
    });
  });

  describe('the --run flag, the default human view and the --json branch', () => {
    it('VALID: {callArgs: [--instance, <killed>, --run, run_1]} => the rendered human view, matching the same query read straight off the tree', async () => {
      const expectedAnswer = await tree.readResults({
        query: ResultsQueryStub({ instanceId: tree.killedInstanceId(), runId: tree.runOne() }),
      });

      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      const result = await SiegelenseResultsLayerFlow({
        callArgs: ['--instance', tree.killedInstanceId(), '--run', tree.runOne()],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(result).toStrictEqual({ success: true });
      expect(wholeOutput).toBe(resultsAnswerRenderTransformer({ answer: expectedAnswer }));
    });

    it('VALID: {callArgs: [--instance, <killed>, --run, run_1, --json]} => the same answer as raw JSON', async () => {
      const expectedAnswer = await tree.readResults({
        query: ResultsQueryStub({ instanceId: tree.killedInstanceId(), runId: tree.runOne() }),
      });

      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseResultsLayerFlow({
        callArgs: ['--instance', tree.killedInstanceId(), '--run', tree.runOne(), '--json'],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual(expectedAnswer);
    });
  });

  describe('the --step flag, combined with --kind console', () => {
    it('VALID: {callArgs: [..., --kind, console, --step, 2, --json]} => only step 2 entries, matching the same query read off the tree', async () => {
      const expectedAnswer = await tree.readResults({
        query: ResultsQueryStub({
          instanceId: tree.killedInstanceId(),
          runId: tree.runOne(),
          kind: 'console',
          step: StepIndexStub({ value: 2 }),
        }),
      });

      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseResultsLayerFlow({
        callArgs: [
          '--instance',
          tree.killedInstanceId(),
          '--run',
          tree.runOne(),
          '--kind',
          'console',
          '--step',
          '2',
          '--json',
        ],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual(expectedAnswer);
      expect(expectedAnswer.rows).toStrictEqual(tree.consoleStep2Rows());
    });
  });

  describe("the --kind flag, the kind not exercised by any other flag's own case: ws", () => {
    it('VALID: {callArgs: [..., --kind, ws, --json]} => a real, legitimate empty answer, never an error', async () => {
      const expectedAnswer = await tree.readResults({
        query: ResultsQueryStub({
          instanceId: tree.killedInstanceId(),
          runId: tree.runOne(),
          kind: 'ws',
        }),
      });

      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseResultsLayerFlow({
        callArgs: [
          '--instance',
          tree.killedInstanceId(),
          '--run',
          tree.runOne(),
          '--kind',
          'ws',
          '--json',
        ],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual(expectedAnswer);
      expect(expectedAnswer).toStrictEqual({
        instanceId: tree.killedInstanceId(),
        instanceState: 'killed',
        runId: tree.runOne(),
        kind: 'ws',
        step: null,
        verb: null,
        prunedAtMs: null,
        prunedByRule: null,
        matched: 0,
        returned: 0,
        truncated: false,
        rows: [],
        storedReturn: null,
      });
    });
  });

  describe('the --kind flag: screenshots', () => {
    it('VALID: {callArgs: [..., --kind, screenshots, --json]} => the shot row, matching the same query read off the tree', async () => {
      const expectedAnswer = await tree.readResults({
        query: ResultsQueryStub({
          instanceId: tree.killedInstanceId(),
          runId: tree.runOne(),
          kind: 'screenshots',
        }),
      });

      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseResultsLayerFlow({
        callArgs: [
          '--instance',
          tree.killedInstanceId(),
          '--run',
          tree.runOne(),
          '--kind',
          'screenshots',
          '--json',
        ],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual(expectedAnswer);
      expect(expectedAnswer.rows.map((row) => JSON.parse(row))).toStrictEqual([
        {
          step: 1,
          path: tree.run1Shot1Path(),
          open: true,
          why: 'blank',
          node: null,
          pixelChange: null,
          blank: true,
          blankColour: '#0d0907',
        },
      ]);
    });
  });

  describe('the --kind flag: steps', () => {
    it('VALID: {callArgs: [..., --kind, steps, --json]} => every step reading in the run, matching the same query read off the tree', async () => {
      const expectedAnswer = await tree.readResults({
        query: ResultsQueryStub({
          instanceId: tree.killedInstanceId(),
          runId: tree.runOne(),
          kind: 'steps',
        }),
      });

      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseResultsLayerFlow({
        callArgs: [
          '--instance',
          tree.killedInstanceId(),
          '--run',
          tree.runOne(),
          '--kind',
          'steps',
          '--json',
        ],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual(expectedAnswer);
      expect(expectedAnswer.matched).toBe(3);
    });
  });

  describe('the --where-path flag, kind network', () => {
    it('VALID: {callArgs: [..., --kind, network, --where-path, /api/x, --json]} => only the row whose url carries that path', async () => {
      const expectedAnswer = await tree.readResults({
        query: ResultsQueryStub({
          instanceId: tree.killedInstanceId(),
          runId: tree.runTwo(),
          kind: 'network',
          where: ResultWhereStub({ path: '/api/x' }),
        }),
      });

      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseResultsLayerFlow({
        callArgs: [
          '--instance',
          tree.killedInstanceId(),
          '--run',
          tree.runTwo(),
          '--kind',
          'network',
          '--where-path',
          '/api/x',
          '--json',
        ],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual(expectedAnswer);

      const [firstNonSuccessRow] = tree.networkRun2NonSuccessRows();

      expect(expectedAnswer.rows).toStrictEqual([firstNonSuccessRow]);
    });
  });

  describe('the --where-method flag, kind network', () => {
    it('VALID: {callArgs: [..., --kind, network, --where-method, POST, --json]} => only the POST exchange', async () => {
      const expectedAnswer = await tree.readResults({
        query: ResultsQueryStub({
          instanceId: tree.killedInstanceId(),
          runId: tree.runOne(),
          kind: 'network',
          where: ResultWhereStub({ method: 'POST' }),
        }),
      });

      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseResultsLayerFlow({
        callArgs: [
          '--instance',
          tree.killedInstanceId(),
          '--run',
          tree.runOne(),
          '--kind',
          'network',
          '--where-method',
          'POST',
          '--json',
        ],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual(expectedAnswer);
      expect(expectedAnswer.rows).toStrictEqual(tree.networkRun1NonSuccessRows());
    });
  });

  describe('the --where-nth flag, kind network', () => {
    it("VALID: {callArgs: [..., --kind, network, --where-nth, 1, --json]} => only the row at position 1 among run_2's matches", async () => {
      const expectedAnswer = await tree.readResults({
        query: ResultsQueryStub({
          instanceId: tree.killedInstanceId(),
          runId: tree.runTwo(),
          kind: 'network',
          where: ResultWhereStub({ nth: 1 }),
        }),
      });

      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseResultsLayerFlow({
        callArgs: [
          '--instance',
          tree.killedInstanceId(),
          '--run',
          tree.runTwo(),
          '--kind',
          'network',
          '--where-nth',
          '1',
          '--json',
        ],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual(expectedAnswer);

      const [, secondNonSuccessRow] = tree.networkRun2NonSuccessRows();

      expect(expectedAnswer.rows).toStrictEqual([secondNonSuccessRow]);
    });
  });

  describe('the --where-level flag, kind console', () => {
    it('VALID: {callArgs: [..., --kind, console, --where-level, error, --json]} => only the console error lines', async () => {
      const expectedAnswer = await tree.readResults({
        query: ResultsQueryStub({
          instanceId: tree.killedInstanceId(),
          runId: tree.runOne(),
          kind: 'console',
          where: ResultWhereStub({ level: 'error' }),
        }),
      });

      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseResultsLayerFlow({
        callArgs: [
          '--instance',
          tree.killedInstanceId(),
          '--run',
          tree.runOne(),
          '--kind',
          'console',
          '--where-level',
          'error',
          '--json',
        ],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual(expectedAnswer);
      expect(expectedAnswer.rows).toStrictEqual(tree.consoleRun1ErrorRows());
    });
  });

  describe('the --where-steps flag, kind server', () => {
    it('VALID: {callArgs: [..., --kind, server, --where-steps, 2-2, --json]} => the server log sliced to step 2 alone', async () => {
      const expectedAnswer = await tree.readResults({
        query: ResultsQueryStub({
          instanceId: tree.killedInstanceId(),
          runId: tree.runOne(),
          kind: 'server',
          where: ResultWhereStub({ steps: '2-2' }),
        }),
      });

      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseResultsLayerFlow({
        callArgs: [
          '--instance',
          tree.killedInstanceId(),
          '--run',
          tree.runOne(),
          '--kind',
          'server',
          '--where-steps',
          '2-2',
          '--json',
        ],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual(expectedAnswer);
      expect(expectedAnswer.rows).toStrictEqual([tree.serverInsideWindowRow()]);
    });
  });

  describe('the --kind flag: server, exercised again through --where-level', () => {
    it('VALID: {callArgs: [..., --kind, server, --where-level, error, --json]} => both server error lines in the run', async () => {
      const expectedAnswer = await tree.readResults({
        query: ResultsQueryStub({
          instanceId: tree.killedInstanceId(),
          runId: tree.runOne(),
          kind: 'server',
          where: ResultWhereStub({ level: 'error' }),
        }),
      });

      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseResultsLayerFlow({
        callArgs: [
          '--instance',
          tree.killedInstanceId(),
          '--run',
          tree.runOne(),
          '--kind',
          'server',
          '--where-level',
          'error',
          '--json',
        ],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual(expectedAnswer);
      expect(expectedAnswer.rows).toStrictEqual([
        tree.serverInsideWindowRow(),
        tree.serverOutsideWindowRow(),
      ]);
    });
  });

  describe('the --fields flag, projecting a network row', () => {
    it('VALID: {callArgs: [..., --where-method, POST, --fields, status,method, --json]} => the row reduced to exactly those two keys', async () => {
      const [unprojectedRow] = tree.networkRun1NonSuccessRows();
      const projectFields = [
        ResultFieldStub({ value: 'status' }),
        ResultFieldStub({ value: 'method' }),
      ];
      const expectedProjectedRow = resultRowProjectTransformer({
        row: unprojectedRow!,
        fields: projectFields,
      });
      const expectedAnswer = await tree.readResults({
        query: ResultsQueryStub({
          instanceId: tree.killedInstanceId(),
          runId: tree.runOne(),
          kind: 'network',
          where: ResultWhereStub({ method: 'POST' }),
          fields: projectFields,
        }),
      });

      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseResultsLayerFlow({
        callArgs: [
          '--instance',
          tree.killedInstanceId(),
          '--run',
          tree.runOne(),
          '--kind',
          'network',
          '--where-method',
          'POST',
          '--fields',
          'status,method',
          '--json',
        ],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual(expectedAnswer);
      expect(expectedAnswer.rows).toStrictEqual([expectedProjectedRow]);
    });
  });

  describe('the --since flag, standing on its own with no --run', () => {
    it('VALID: {callArgs: [--instance, <killed>, --kind, console, --since, boot, --json]} => every console line across both runs, matching the same query read off the tree', async () => {
      const expectedAnswer = await tree.readResults({
        query: ResultsQueryStub({
          instanceId: tree.killedInstanceId(),
          kind: 'console',
          since: 'boot',
        }),
      });

      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseResultsLayerFlow({
        callArgs: [
          '--instance',
          tree.killedInstanceId(),
          '--kind',
          'console',
          '--since',
          'boot',
          '--json',
        ],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual(expectedAnswer);
      expect(expectedAnswer.runId).toBe(null);
    });
  });

  describe('the --since boot refusal when no --kind is named', () => {
    it('ERROR: {callArgs: [--instance, <killed>, --since, boot]} => refuses naming the sinceBoot-eligible kinds, and never writes to stdout', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await expect(
        SiegelenseResultsLayerFlow({
          callArgs: ['--instance', tree.killedInstanceId(), '--since', 'boot'],
        }),
      ).rejects.toThrow(
        new RegExp(
          `^results against instance ${tree.killedInstanceId()} with since: 'boot' and no kind ` +
            `cannot answer: boot spans every run, and only console, network, ws hold lines for the ` +
            `whole timeline\\. Name one with --kind <kind>, or drop --since boot to read a single ` +
            `run's steps, server or screenshots\\.$`,
          'u',
        ),
      );

      process.stdout.write = originalWrite;

      expect(writes).toStrictEqual([]);
    });
  });

  describe('--run and --since boot, mutually exclusive in either argv order', () => {
    it('ERROR: {callArgs: [--run, run_1, --since, boot]} => rejects naming both flags', async () => {
      await expect(
        SiegelenseResultsLayerFlow({
          callArgs: [
            '--instance',
            tree.killedInstanceId(),
            '--run',
            tree.runOne(),
            '--since',
            'boot',
          ],
        }),
      ).rejects.toThrow(
        /^--run and --since are mutually exclusive: --run names one run's evidence, --since reads the whole boot timeline, and both were given\.$/u,
      );
    });

    it('ERROR: {callArgs: [--since, boot, --run, run_1]} => rejects naming both flags, order reversed', async () => {
      await expect(
        SiegelenseResultsLayerFlow({
          callArgs: [
            '--instance',
            tree.killedInstanceId(),
            '--since',
            'boot',
            '--run',
            tree.runOne(),
          ],
        }),
      ).rejects.toThrow(
        /^--run and --since are mutually exclusive: --run names one run's evidence, --since reads the whole boot timeline, and both were given\.$/u,
      );
    });
  });

  describe('a missing --run against a finished instance with runs on record', () => {
    it('ERROR: {callArgs: [--instance, <killed>]} => rejects carrying RunIdRequiredError and its exact message, and never writes to stdout', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await expect(
        SiegelenseResultsLayerFlow({ callArgs: ['--instance', tree.killedInstanceId()] }),
      ).rejects.toThrow(RunIdRequiredError);
      await expect(
        SiegelenseResultsLayerFlow({ callArgs: ['--instance', tree.killedInstanceId()] }),
      ).rejects.toThrow(
        new RunIdRequiredError({
          instanceId: tree.killedInstanceId(),
          instanceState: 'killed',
          runCount: 2,
        }),
      );

      process.stdout.write = originalWrite;

      expect(writes).toStrictEqual([]);
    });
  });

  describe('the --kind flag rejects a value outside the six it accepts', () => {
    it('INVALID: {callArgs: [--kind, bogus]} => names the six accepted values and the bad one received', async () => {
      await expect(
        SiegelenseResultsLayerFlow({
          callArgs: ['--instance', tree.killedInstanceId(), '--kind', 'bogus'],
        }),
      ).rejects.toThrow(
        /^--kind must be one of: console, network, ws, server, screenshots, steps\. Received: "bogus"\.$/u,
      );
    });
  });
});
