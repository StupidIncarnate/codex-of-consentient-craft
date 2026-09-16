import {
  installTestbedCreateBroker,
  BaseNameStub,
  FileContentStub,
  RelativePathStub,
} from '@dungeonmaster/testing';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { CompareQueryStub } from '../../contracts/compare-query/compare-query.stub';
import { ResultsQueryStub } from '../../contracts/results-query/results-query.stub';
import { ResultWhereStub } from '../../contracts/result-where/result-where.stub';
import { StepIndexStub } from '../../contracts/step-index/step-index.stub';
import { InstanceUnknownError } from '../../errors/instance-unknown/instance-unknown-error';
import { RunIdRequiredError } from '../../errors/run-id-required/run-id-required-error';
import { RunMissingError } from '../../errors/run-missing/run-missing-error';
import { evidenceTreeHarness } from '../../../test/harnesses/evidence-tree/evidence-tree.harness';
import { SiegelenseFlow } from './siegelense-flow';

describe('SiegelenseFlow', () => {
  const testbed = installTestbedCreateBroker({
    baseName: BaseNameStub({ value: 'siegelense-flow' }),
  });
  const originalHome = process.env.DUNGEONMASTER_HOME;
  process.env.DUNGEONMASTER_HOME = testbed.guildPath;

  beforeAll(() => {
    // `dungeonmaster init` mkdir -p's this directory at install time (InstallLinkCreateResponder),
    // so it always exists before a real person can type `status` — the testbed has to recreate
    // that same precondition, or machineReadBroker's real statfs read throws ENOENT on a directory
    // a real install would already have made.
    testbed.writeFile({
      relativePath: RelativePathStub({ value: 'siegelense/.keep' }),
      content: FileContentStub({ value: '' }),
    });
  });

  describe('the bare invocation', () => {
    it('VALID: {args: []} => routes to the fleet responder and reports an empty fleet', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseFlow({ args: [] });

      process.stdout.write = originalWrite;

      expect(writes).toStrictEqual(['No siegelense instances running.\n']);
    });
  });

  describe('the driver route', () => {
    it('ERROR: {args: driver --instance <unreserved id>} => routes to the driver responder, which rejects naming the instance', async () => {
      await expect(
        SiegelenseFlow({ args: ['driver', '--instance', 'inst_dead0000'] }),
      ).rejects.toThrow(/inst_dead0000 not found in the registry/u);
    });
  });

  describe('the status route', () => {
    it('VALID: {args: ["status"]} => routes to the status responder and reports an empty fleet', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseFlow({ args: ['status'] });

      process.stdout.write = originalWrite;

      expect(writes).toStrictEqual(['No siegelense instances running.\n']);
    });

    it('ERROR: {args: status --instance <badly-shaped id>} => routes to the status responder, which rejects the id shape', async () => {
      await expect(
        SiegelenseFlow({ args: ['status', '--instance', 'not-a-valid-id'] }),
      ).rejects.toThrow(/Instance id must look like/u);
    });

    it('INVALID: {args: status --instance} => rejects naming the flag instead of silently printing the whole fleet', async () => {
      await expect(SiegelenseFlow({ args: ['status', '--instance'] })).rejects.toThrow(
        /^--instance is required: it cannot be missing, and the value cannot itself start with "--"\.\n\nUsage: dungeonmaster siegelense \[driver --instance <instanceId> \| status \[--instance <instanceId>\] \| cleanup\]$/u,
      );
    });
  });

  describe('the cleanup route', () => {
    it('VALID: {args: ["cleanup"]} => routes to the cleanup responder and reports nothing reaped or left alone', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseFlow({ args: ['cleanup'] });

      process.stdout.write = originalWrite;

      expect(writes).toStrictEqual([
        'REAPED: none\nPORTS RELEASED: none\nLOCK RELEASED: no\nLEFT ALONE: none\n',
      ]);
    });
  });

  describe('an unknown subcommand', () => {
    it('INVALID: {args: [statuss]} => rejects naming the unknown subcommand instead of falling back to the fleet listing', async () => {
      await expect(SiegelenseFlow({ args: ['statuss'] })).rejects.toThrow(
        /^Unknown siegelense subcommand: statuss\n\nUsage: dungeonmaster siegelense \[driver --instance <instanceId> \| status \[--instance <instanceId>\] \| cleanup\]$/u,
      );
    });
  });

  afterAll(() => {
    if (originalHome === undefined) {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
    } else {
      process.env.DUNGEONMASTER_HOME = originalHome;
    }
    testbed.cleanup();
  });

  // Chunk 3's read path: results/status/compare/cleanup resolve off a REAL evidence tree, with no
  // driver, no browser and no port pair (chunk-03-read-path-and-perception.md §1). `tree`'s own
  // beforeEach/afterEach mint a fresh testbed and DUNGEONMASTER_HOME per test, isolated from the
  // routing tests above and from each other, so cleanup's reap and the crash variant's deleted
  // stored return never leak between tests.
  describe('the read path — results, status, compare, cleanup (chunk 3)', () => {
    const tree = evidenceTreeHarness();

    describe('results', () => {
      it('VALID: {results, run named, no kind} => the stored RunResult read back byte-for-byte', async () => {
        const result = await tree.readResults({
          query: ResultsQueryStub({ instanceId: tree.killedInstanceId(), runId: tree.runOne() }),
        });

        expect(result).toStrictEqual({
          instanceId: tree.killedInstanceId(),
          instanceState: 'killed',
          runId: tree.runOne(),
          kind: null,
          step: null,
          verb: null,
          prunedAtMs: null,
          prunedByRule: null,
          matched: 0,
          returned: 0,
          truncated: false,
          rows: [],
          storedReturn: tree.run1Result(),
        });
      });

      it('VALID: {results, kind: console, step: 2} => only step 2 entries', async () => {
        const result = await tree.readResults({
          query: ResultsQueryStub({
            instanceId: tree.killedInstanceId(),
            runId: tree.runOne(),
            kind: 'console',
            step: StepIndexStub({ value: 2 }),
          }),
        });

        expect(result).toStrictEqual({
          instanceId: tree.killedInstanceId(),
          instanceState: 'killed',
          runId: tree.runOne(),
          kind: 'console',
          step: 2,
          verb: null,
          prunedAtMs: null,
          prunedByRule: null,
          matched: 2,
          returned: 2,
          truncated: false,
          rows: tree.consoleStep2Rows(),
          storedReturn: null,
        });
      });

      it("VALID: {results, kind: 'server', where: steps and level} => the one error line inside the window", async () => {
        const result = await tree.readResults({
          query: ResultsQueryStub({
            instanceId: tree.killedInstanceId(),
            runId: tree.runOne(),
            kind: 'server',
            where: ResultWhereStub({ steps: '2-2', level: 'error' }),
          }),
        });

        expect(result).toStrictEqual({
          instanceId: tree.killedInstanceId(),
          instanceState: 'killed',
          runId: tree.runOne(),
          kind: 'server',
          step: null,
          verb: null,
          prunedAtMs: null,
          prunedByRule: null,
          matched: 1,
          returned: 1,
          truncated: false,
          rows: [tree.serverInsideWindowRow()],
          storedReturn: null,
        });
      });

      it('VALID: {results, kind: screenshots} => both shots with node labels, measured pixelChange and blank', async () => {
        const run1Answer = await tree.readResults({
          query: ResultsQueryStub({
            instanceId: tree.killedInstanceId(),
            runId: tree.runOne(),
            kind: 'screenshots',
          }),
        });
        const run2Answer = await tree.readResults({
          query: ResultsQueryStub({
            instanceId: tree.killedInstanceId(),
            runId: tree.runTwo(),
            kind: 'screenshots',
          }),
        });

        const measuredBlank1 = await tree.measureBlank({ shotPath: tree.run1Shot1Path() });
        const measuredBlank2 = await tree.measureBlank({ shotPath: tree.run2Shot1Path() });
        const measuredChange = await tree.measureChange({
          previousPath: tree.run1Shot1Path(),
          currentPath: tree.run2Shot1Path(),
        });

        expect(run1Answer.rows.map((row) => JSON.parse(row))).toStrictEqual([
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
        expect(run2Answer.rows.map((row) => JSON.parse(row))).toStrictEqual([
          {
            step: 1,
            path: tree.run2Shot1Path(),
            open: true,
            why: 'changed',
            node: null,
            pixelChange: '50%',
            blank: false,
            blankColour: null,
          },
        ]);
        expect(tree.run1Shot1Path().startsWith('/')).toBe(true);
        expect(tree.run2Shot1Path().startsWith('/')).toBe(true);
        expect(measuredBlank1).toStrictEqual({ blank: true, colour: '#0d0907' });
        expect(measuredBlank2).toStrictEqual({ blank: false, colour: null });
        expect(measuredChange).toBe('50%');
      });

      it('ERROR: {results, killed instance, no run} => RunIdRequiredError', async () => {
        await expect(
          tree.readResults({ query: ResultsQueryStub({ instanceId: tree.killedInstanceId() }) }),
        ).rejects.toThrow(RunIdRequiredError);
      });

      it("EMPTY: {results, an id the registry never held} => instanceState 'unknown', rows []", async () => {
        const result = await tree.readResults({
          query: ResultsQueryStub({ instanceId: tree.unknownInstanceId() }),
        });

        expect(result).toStrictEqual({
          instanceId: tree.unknownInstanceId(),
          instanceState: 'unknown',
          runId: null,
          kind: null,
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

      it('EDGE: {results, run_2.jsonl present, run_2.json absent} => still reaches run 2', async () => {
        tree.crashRun2();

        const noKindAnswer = await tree.readResults({
          query: ResultsQueryStub({ instanceId: tree.killedInstanceId(), runId: tree.runTwo() }),
        });
        const stepsAnswer = await tree.readResults({
          query: ResultsQueryStub({
            instanceId: tree.killedInstanceId(),
            runId: tree.runTwo(),
            kind: 'steps',
          }),
        });

        expect(noKindAnswer).toStrictEqual({
          instanceId: tree.killedInstanceId(),
          instanceState: 'killed',
          runId: tree.runTwo(),
          kind: null,
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
        expect(stepsAnswer).toStrictEqual({
          instanceId: tree.killedInstanceId(),
          instanceState: 'killed',
          runId: tree.runTwo(),
          kind: 'steps',
          step: null,
          verb: null,
          prunedAtMs: null,
          prunedByRule: null,
          matched: 1,
          returned: 1,
          truncated: false,
          rows: tree.run2Steps().map((step) => JSON.stringify(step)),
          storedReturn: null,
        });
      });
    });

    describe('compare', () => {
      it('VALID: {compare run_1 against run_2} => the deltas and a real pixels percent', async () => {
        const answer = await tree.readCompare({
          query: CompareQueryStub({
            instanceId: tree.killedInstanceId(),
            runA: tree.runOne(),
            runB: tree.runTwo(),
          }),
        });

        expect(answer).toStrictEqual({
          instanceId: tree.killedInstanceId(),
          runA: tree.runOne(),
          runB: tree.runTwo(),
          console: { errors: '+1', new: tree.consoleRun2ErrorRows() },
          server: { errors: '-1', new: tree.serverRun2ErrorRows() },
          network: { non2xx: '+1', new: tree.networkRun2NonSuccessRows() },
          pixels: 'last capture differs 50%',
        });
      });

      it('ERROR: {compare, an id the registry never held} => InstanceUnknownError', async () => {
        await expect(
          tree.readCompare({
            query: CompareQueryStub({
              instanceId: tree.unknownInstanceId(),
              runA: tree.runOne(),
              runB: tree.runTwo(),
            }),
          }),
        ).rejects.toThrow(InstanceUnknownError);
      });

      it('ERROR: {compare, known instance, a run with no stored return} => RunMissingError', async () => {
        tree.crashRun2();

        await expect(
          tree.readCompare({
            query: CompareQueryStub({
              instanceId: tree.killedInstanceId(),
              runA: tree.runOne(),
              runB: tree.runTwo(),
            }),
          }),
        ).rejects.toThrow(RunMissingError);
      });
    });

    describe('status', () => {
      it('VALID: {status, no instance} => both rows, no evidence, no lastStep', async () => {
        const answer = await tree.readStatus({ instanceId: null });

        expect(answer.instances.map((entry) => entry.id)).toStrictEqual([
          tree.killedInstanceId(),
          tree.liveInstanceId(),
        ]);
        expect(answer.instances.map((entry) => entry.evidence)).toStrictEqual([null, null]);
        expect(answer.instances.map((entry) => entry.lastStep)).toStrictEqual([null, null]);
      });

      it('VALID: {status, the killed instance named} => its evidence dir, transcript, last shot and last step, all off the real tree', async () => {
        const answer = await tree.readStatus({ instanceId: tree.killedInstanceId() });
        const [entry] = answer.instances;

        expect(answer.instances.map((instance) => instance.id)).toStrictEqual([
          tree.killedInstanceId(),
        ]);
        expect(entry?.evidence?.dir.path).toBe(tree.killedInstanceEvidenceDir());
        expect(entry?.evidence?.transcript).toBe('run_2.jsonl');
        expect(entry?.evidence?.logs).toStrictEqual(['api-server.log']);
        expect(entry?.evidence?.lastShot).toBe('run_2/step1.png');
        expect(entry?.lastStep).toStrictEqual({ run: 'run_2', step: 1, verb: 'goto' });
        expect(entry?.rssAtLastBeat).toBe(1_840);
        expect(entry?.runs).toBe(2);
        expect(entry?.evidenceComplete).toBe(true);
      });

      it('VALID: {status, the killed instance after its run crashed} => evidenceComplete is false', async () => {
        tree.crashRun2();

        const answer = await tree.readStatus({ instanceId: tree.killedInstanceId() });
        const [entry] = answer.instances;

        expect(entry?.evidenceComplete).toBe(false);
        expect(entry?.runs).toBe(2);
        expect(entry?.evidence?.transcript).toBe('run_2.jsonl');
      });

      it('VALID: {status --instance, an id the registry never held} => distinguishes "unknown" from an empty fleet', async () => {
        const writes: ReturnType<typeof ContentTextStub>[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);
        process.stdout.write = ((chunk: string): boolean => {
          writes.push(ContentTextStub({ value: chunk }));
          return true;
        }) as unknown as typeof process.stdout.write;

        await SiegelenseFlow({ args: ['status', '--instance', tree.unknownInstanceId()] });

        process.stdout.write = originalWrite;

        expect(writes).toStrictEqual([
          `No instance by the id "${tree.unknownInstanceId()}" — unknown, never existed.\n`,
        ]);
      });

      it('VALID: {dungeonmaster siegelense status through SiegelenseFlow} => the rendered text', async () => {
        const writes: ReturnType<typeof ContentTextStub>[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);
        process.stdout.write = ((chunk: string): boolean => {
          writes.push(ContentTextStub({ value: chunk }));
          return true;
        }) as unknown as typeof process.stdout.write;

        await SiegelenseFlow({ args: ['status'] });

        process.stdout.write = originalWrite;

        // A single SiegelenseFlow({args: ['status']}) call makes exactly one
        // process.stdout.write (SiegelenseStatusResponder's own header comment says so) — proven
        // here by the non-null assertion below actually resolving rather than throwing, since an
        // empty `writes` would make `wholeOutput` undefined and `.split` throw.
        const [wholeOutput] = writes;
        const lines = wholeOutput!.split('\n');

        expect(lines.slice(2, 4)).toStrictEqual([
          'ID\tSTATE\tSPEC\tUPTIME\tLAST BEAT\tRUNS\tRSS\tORPHANS',
          `${tree.killedInstanceId()}\tkilled\tdungeonmaster-web\t-\t-\t2\t1840MB\t0`,
        ]);
      });
    });

    describe('cleanup', () => {
      it('VALID: {cleanup} => a real stale registry row reaped, a real live row left alone', async () => {
        const staleId = await tree.addStaleAliveEntry();

        const answer = await tree.runCleanup();

        expect(answer).toStrictEqual({
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
  });
});
