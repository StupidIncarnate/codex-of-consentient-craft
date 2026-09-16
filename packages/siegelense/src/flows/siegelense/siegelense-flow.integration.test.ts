import {
  installTestbedCreateBroker,
  BaseNameStub,
  FileContentStub,
  RelativePathStub,
} from '@dungeonmaster/testing';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { CleanupAnswerStub } from '../../contracts/cleanup-answer/cleanup-answer.stub';
import { CompareQueryStub } from '../../contracts/compare-query/compare-query.stub';
import { ResultsQueryStub } from '../../contracts/results-query/results-query.stub';
import { ResultWhereStub } from '../../contracts/result-where/result-where.stub';
import { StepIndexStub } from '../../contracts/step-index/step-index.stub';
import { InstanceUnknownError } from '../../errors/instance-unknown/instance-unknown-error';
import { RunIdRequiredError } from '../../errors/run-id-required/run-id-required-error';
import { RunMissingError } from '../../errors/run-missing/run-missing-error';
import { SiegelenseStatusResponder } from '../../responders/siegelense/status/siegelense-status-responder';
import { machineStatics } from '../../statics/machine/machine-statics';
import { siegelenseCallStatics } from '../../statics/siegelense-call/siegelense-call-statics';
import { siegelenseHelpStatics } from '../../statics/siegelense-help/siegelense-help-statics';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { siegelenseHelpRenderTransformer } from '../../transformers/siegelense-help-render/siegelense-help-render-transformer';
import { evidenceTreeHarness } from '../../../test/harnesses/evidence-tree/evidence-tree.harness';
import { recipesRouteOutcomeHarness } from '../../../test/harnesses/recipes-route-outcome/recipes-route-outcome.harness';
import { SiegelenseFlow } from './siegelense-flow';

// The built calls, in the order `siegelenseHelpStatics.calls` declares them — every it.each
// below over "every built call" derives from this rather than a second hardcoded list.
const BUILT_CALLS = Object.keys(
  siegelenseHelpStatics.calls,
) as (keyof typeof siegelenseHelpStatics.calls)[];

// `statusReadBroker` always calls `machineReadBroker` (a live statfs/loadavg read), for a fleet
// query and a named one alike, so the one deterministic shape an empty-instances StatusAnswer's
// JSON can be compared against omits `machine` entirely rather than guessing its live values.
// `queriedInstanceState: null` is the fleet-listing case — no single id was named, so there is
// nothing for the field to report.
const EMPTY_FLEET_STATUS_JSON = `${JSON.stringify(
  { monitored: machineStatics.monitored, instances: [], queriedInstanceState: null },
  null,
  siegelenseOutputStatics.json.indentSpaces,
)}\n`;

// The same shape, but for a NAMED query that resolved to no registry row — the defect this file's
// own `status --instance <id never held>` tests guard: without `queriedInstanceState`, this JSON
// was byte-identical to `EMPTY_FLEET_STATUS_JSON` above, and only `--human` could tell the two
// apart (siegelense-tooling.md:2317, 2319-2321 — "unknown" is a real answer, not an empty result).
const UNKNOWN_NAMED_STATUS_JSON = `${JSON.stringify(
  { monitored: machineStatics.monitored, instances: [], queriedInstanceState: 'unknown' },
  null,
  siegelenseOutputStatics.json.indentSpaces,
)}\n`;

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

    it('ERROR: {args: driver --instance <badly-shaped id>} => rejects the id shape naming --instance rather than a raw ZodError', async () => {
      await expect(
        SiegelenseFlow({ args: ['driver', '--instance', 'not-a-valid-id'] }),
      ).rejects.toThrow(
        /^--instance: Instance id must look like "inst_" followed by 4 or more lowercase hex characters, e\.g\. "inst_7f3a9c21"$/u,
      );
    });
  });

  describe('the status route', () => {
    it('VALID: {args: ["status"]} => routes to the status responder and reports an empty fleet as one JSON document', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseFlow({ args: ['status'] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;
      const withoutLiveMachineBlock = wholeOutput!.replace(
        / {2}"machine": \{[\s\S]*?\n {2}\},\n/u,
        '',
      );

      expect(withoutLiveMachineBlock).toBe(EMPTY_FLEET_STATUS_JSON);
    });

    it('ERROR: {args: status --instance <badly-shaped id>} => routes to the status responder, which rejects the id shape naming --instance rather than a raw ZodError', async () => {
      await expect(
        SiegelenseFlow({ args: ['status', '--instance', 'not-a-valid-id'] }),
      ).rejects.toThrow(
        /^--instance: Instance id must look like "inst_" followed by 4 or more lowercase hex characters, e\.g\. "inst_7f3a9c21"$/u,
      );
    });

    it('INVALID: {args: status --instance} => rejects naming the flag instead of silently printing the whole fleet', async () => {
      // The check moved to `statusArgsParseTransformer`, which delegates to
      // `flagValueReadTransformer` and carries none of the flow's own USAGE suffix — this is the
      // real message that transformer throws, captured by running it rather than guessed.
      await expect(SiegelenseFlow({ args: ['status', '--instance'] })).rejects.toThrow(
        /^--instance is required: it cannot be missing, and the value cannot itself start with "--"\.$/u,
      );
    });
  });

  describe('the cleanup route', () => {
    it('VALID: {args: ["cleanup"]} => routes to the cleanup responder and reports nothing reaped or left alone as one JSON document', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseFlow({ args: ['cleanup'] });

      process.stdout.write = originalWrite;

      const expectedAnswer = CleanupAnswerStub({
        reaped: [],
        portsReleased: [],
        lockReleased: false,
        leftAlone: [],
      });

      expect(writes).toStrictEqual([
        `${JSON.stringify(expectedAnswer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  // `packages/siegelense-recipes/dist/index.js` is compiled output from a sibling package this
  // chunk does not build, so `recipesLocateBroker` (C2) — real fs I/O against that exact path —
  // resolves or rejects differently depending on that package's own build state. What holds in
  // EITHER state, and what these two tests assert: `recipes` always reaches the real recipes
  // pipeline, never SiegelenseFlow's own refusals (the generic "is a siegelense call but is not
  // built yet" fall-through, or the named "--human is not implemented" refusal) —
  // `recipesRouteOutcomeHarness` is the one door this suite has to that distinction, since
  // jest/no-conditional-in-test refuses the branch it needs inside an `it` body.
  describe('the recipes route', () => {
    const recipesRouteOutcome = recipesRouteOutcomeHarness();

    it('VALID: {args: ["recipes"]} => reaches the real recipes pipeline, never the flow\'s own "not built yet" refusal', async () => {
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((): boolean => true) as unknown as typeof process.stdout.write;

      const [settled] = await Promise.allSettled([SiegelenseFlow({ args: ['recipes'] })]);

      process.stdout.write = originalWrite;

      expect(recipesRouteOutcome.reachedPipeline({ settled })).toBe(true);
    });

    it('VALID: {args: ["recipes", "--human"]} => --human is accepted for recipes rather than refused by name', async () => {
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((): boolean => true) as unknown as typeof process.stdout.write;

      const [settled] = await Promise.allSettled([
        SiegelenseFlow({ args: ['recipes', '--human'] }),
      ]);

      process.stdout.write = originalWrite;

      expect(recipesRouteOutcome.reachedPipeline({ settled })).toBe(true);
    });

    it('VALID: {args: ["recipes", "--help"]} => writes the recipes page, first line its summary', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      const result = await SiegelenseFlow({ args: ['recipes', '--help'] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;
      const [firstLine] = wholeOutput!.split('\n');

      expect(firstLine).toBe(siegelenseHelpStatics.calls.recipes.summary);
      expect(result).toStrictEqual({ success: true });
    });

    it('INVALID: {args: ["recipes", "--bogus"]} => rejects the unknown flag before reaching the responder', async () => {
      await expect(SiegelenseFlow({ args: ['recipes', '--bogus'] })).rejects.toThrow(
        /^Unknown flag: --bogus\n\n[\s\S]*Accepted flags: --json, --human\n\nUsage: dungeonmaster siegelense recipes \[--json\] \[--human\]$/u,
      );
    });
  });

  describe('the --help index reflects the newly routed recipes call', () => {
    it('VALID: {args: [--help]} => recipes is listed under CALLS, and NOT BUILT YET holds exactly the remaining five', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseFlow({ args: ['--help'] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;
      const [, afterCallsHeading] = wholeOutput!.split('CALLS\n');
      const [callsSection, afterNotBuiltHeading] = afterCallsHeading!.split('\n\nNOT BUILT YET\n');
      const [notBuiltSection] = afterNotBuiltHeading!.split('\n\n');

      // Two precise array equalities in one test: if `recipes` were left behind in
      // NOT BUILT YET after being added to CALLS, the second assertion catches it — the exact
      // mistake this test exists to catch.
      expect(callsSection!.split('\n')).toStrictEqual([
        '  siegelense start — boot one instance for a lane spec and block until the driver answers or the boot deadline passes.',
        '  siegelense run — submit one batch of steps to a running instance and block until it finishes.',
        '  siegelense results — read evidence off disk for one instance. Starts nothing.',
        '  siegelense kill — stop one running instance.',
        '  siegelense status — report the fleet, or one instance in full.',
        '  siegelense cleanup — reap every stale instance the registry holds.',
        "  siegelense compare — diff two runs of one instance's timeline.",
        '  siegelense recipes — list what states can be created. No instance needed.',
      ]);
      expect(notBuiltSection!.split('\n')).toStrictEqual([
        '  capacity',
        '  profile',
        '  prune',
        '  snapshots',
        '  docs',
      ]);
    });

    it('VALID: {args: [--help]} => the headline names the built count the route table actually holds', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseFlow({ args: ['--help'] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;
      const [headlineLine] = wholeOutput!.split('\n');

      expect(headlineLine).toBe(
        'dungeonmaster siegelense — every built call reachable without installing anything. ' +
          `${BUILT_CALLS.length} of ${siegelenseCallStatics.calls.names.length} calls are built.`,
      );
    });
  });

  describe('an unknown subcommand', () => {
    it('INVALID: {args: [statuss]} => rejects naming the unknown subcommand instead of falling back to the fleet listing', async () => {
      await expect(SiegelenseFlow({ args: ['statuss'] })).rejects.toThrow(
        /^Unknown siegelense subcommand: statuss\n\nUsage: dungeonmaster siegelense \[--help \| start \| run \| results \| kill \| status \| cleanup \| compare \| recipes\]$/u,
      );
    });

    // The regression guard for the bug this file's whole change removes: the usage line is built
    // from BUILT_CALLS (siegelenseHelpStatics.calls's own keys, proven elsewhere in this file to
    // match SiegelenseFlow's route table) rather than compared against a second hand-typed string,
    // so a call landing in the route table with no matching edit here still passes.
    it("VALID: {args: [statuss]} => the usage line names every built call, in the route table's own order", async () => {
      await expect(SiegelenseFlow({ args: ['statuss'] })).rejects.toThrow(
        new RegExp(
          `Usage: dungeonmaster siegelense \\[--help \\| ${BUILT_CALLS.join(' \\| ')}\\]$`,
          'u',
        ),
      );
    });
  });

  describe('a name the spec defines but this chunk has not built', () => {
    it('INVALID: {args: [capacity]} => rejects naming it as not built yet, listing the built calls, rather than calling it unknown', async () => {
      await expect(SiegelenseFlow({ args: ['capacity'] })).rejects.toThrow(
        /^capacity is a siegelense call but is not built yet\. Built calls: start, run, results, kill, status, cleanup, compare, recipes\.$/u,
      );
    });
  });

  describe('the --help surface', () => {
    it('VALID: {args: [--help]} => writes the index page to stdout and returns success', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      const result = await SiegelenseFlow({ args: ['--help'] });

      process.stdout.write = originalWrite;

      expect(writes).toStrictEqual([siegelenseHelpRenderTransformer({ call: null })]);
      expect(result).toStrictEqual({ success: true });
    });

    it.each(BUILT_CALLS)(
      'VALID: {args: [%s, --help]} => writes that call help page, first line its summary',
      async (call) => {
        const writes: ReturnType<typeof ContentTextStub>[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);
        process.stdout.write = ((chunk: string): boolean => {
          writes.push(ContentTextStub({ value: chunk }));
          return true;
        }) as unknown as typeof process.stdout.write;

        const result = await SiegelenseFlow({ args: [call, '--help'] });

        process.stdout.write = originalWrite;

        const [wholeOutput] = writes;
        const [firstLine] = wholeOutput!.split('\n');

        expect(firstLine).toBe(siegelenseHelpStatics.calls[call].summary);
        expect(result).toStrictEqual({ success: true });
      },
    );
  });

  describe('the --human refusal', () => {
    it('INVALID: {args: [results, --human]} => rejects naming status, cleanup and recipes as the calls that render', async () => {
      await expect(SiegelenseFlow({ args: ['results', '--human'] })).rejects.toThrow(
        /^--human is not implemented for results: only status and cleanup and recipes render a human table; every other call answers JSON only\.$/u,
      );
    });
  });

  describe('the route table matches the help statics — the gate that cannot close again', () => {
    it('VALID: {--help for every name the spec defines} => exactly the built calls resolve, matching siegelenseHelpStatics.calls', async () => {
      const settled = await Promise.allSettled(
        siegelenseCallStatics.calls.names.map(async (name) =>
          SiegelenseFlow({ args: [name, '--help'] }),
        ),
      );
      const namesWithStatus = siegelenseCallStatics.calls.names.map((name, index) => ({
        name,
        status: settled[index]?.status,
      }));
      const resolvedNames = namesWithStatus
        .filter((entry) => entry.status === 'fulfilled')
        .map((entry) => entry.name);

      expect(resolvedNames).toStrictEqual(BUILT_CALLS);
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
          network: { errors: '+1', new: tree.networkRun2NonSuccessRows() },
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
      it('VALID: {status, no instance} => both rows, no evidence, no lastStep, queriedInstanceState null', async () => {
        const answer = await tree.readStatus({ instanceId: null });

        expect(answer.instances.map((entry) => entry.id)).toStrictEqual([
          tree.killedInstanceId(),
          tree.liveInstanceId(),
        ]);
        expect(answer.instances.map((entry) => entry.evidence)).toStrictEqual([null, null]);
        expect(answer.instances.map((entry) => entry.lastStep)).toStrictEqual([null, null]);
        // A fleet listing names no single id, so there is no "state of the id you asked about" to
        // report.
        expect(answer.queriedInstanceState).toBe(null);
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
        // The tombstone rule (siegelense-tooling.md:2455): a reaped/killed entry survives with its
        // evidence for as long as that evidence does, and is answered as `killed`, never `unknown` —
        // this is what a fixer's first call after `cleanup` reaps a stale row must still see.
        expect(answer.queriedInstanceState).toBe('killed');
      });

      it('VALID: {status, the killed instance after its run crashed} => evidenceComplete is false', async () => {
        tree.crashRun2();

        const answer = await tree.readStatus({ instanceId: tree.killedInstanceId() });
        const [entry] = answer.instances;

        expect(entry?.evidenceComplete).toBe(false);
        expect(entry?.runs).toBe(2);
        expect(entry?.evidence?.transcript).toBe('run_2.jsonl');
      });

      it('VALID: {status --instance, an id the registry never held} => the default JSON now names it "unknown", distinct from an empty fleet', async () => {
        const writes: ReturnType<typeof ContentTextStub>[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);
        process.stdout.write = ((chunk: string): boolean => {
          writes.push(ContentTextStub({ value: chunk }));
          return true;
        }) as unknown as typeof process.stdout.write;

        await SiegelenseFlow({ args: ['status', '--instance', tree.unknownInstanceId()] });

        process.stdout.write = originalWrite;

        const [wholeOutput] = writes;
        const withoutLiveMachineBlock = wholeOutput!.replace(
          / {2}"machine": \{[\s\S]*?\n {2}\},\n/u,
          '',
        );

        // Pinned to its own exact literal (`queriedInstanceState: 'unknown'`), which reads
        // byte-for-byte different from `EMPTY_FLEET_STATUS_JSON` above (`queriedInstanceState:
        // null`) — the regression guard for the whole defect: a named id the registry never held no
        // longer answers the same JSON as an empty fleet.
        expect(withoutLiveMachineBlock).toBe(UNKNOWN_NAMED_STATUS_JSON);
      });

      it('VALID: {--human, an id the registry never held} => names the id as unknown, never existed — the one thing the default JSON cannot say', async () => {
        const writes: ReturnType<typeof ContentTextStub>[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);
        process.stdout.write = ((chunk: string): boolean => {
          writes.push(ContentTextStub({ value: chunk }));
          return true;
        }) as unknown as typeof process.stdout.write;

        // SiegelenseFlow does not parse --human yet — that wiring is SiegelenseFlow's own route
        // table, a later work item — so this calls the responder it would route to directly, with
        // the same instanceId the test above asked SiegelenseFlow for.
        await SiegelenseStatusResponder({ instanceId: tree.unknownInstanceId(), human: true });

        process.stdout.write = originalWrite;

        expect(writes).toStrictEqual([
          `No instance by the id "${tree.unknownInstanceId()}" — unknown, never existed.\n`,
        ]);
      });

      it('VALID: {dungeonmaster siegelense status through SiegelenseFlow} => the fleet as one JSON document, killed then live', async () => {
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
        // empty `writes` would make `wholeOutput` undefined and the match below throw.
        // `machine`, and a LIVE instance's own `lastBeat`/`rssMB`, are live reads that change
        // between runs, so this anchors the whole document's shape (one instances array, exactly
        // two entries, killed before live, `queriedInstanceState` null for this fleet listing) while
        // leaving those two live subtrees as wildcards — the JSON analogue of the machine-block
        // strip above.
        const [wholeOutput] = writes;
        const fleetJsonPattern = new RegExp(
          `^\\{\\n` +
            `  "monitored": \\[[\\s\\S]*?\\],\\n` +
            `  "machine": \\{[\\s\\S]*?\\n {2}\\},\\n` +
            `  "instances": \\[\\n` +
            `    \\{\\n[\\s\\S]*?"id": "${tree.killedInstanceId()}"[\\s\\S]*?\\n {4}\\},\\n` +
            `    \\{\\n[\\s\\S]*?"id": "${tree.liveInstanceId()}"[\\s\\S]*?\\n {4}\\}\\n` +
            `  \\],\\n` +
            `  "queriedInstanceState": null\\n` +
            `\\}\\n$`,
          'u',
        );

        expect(wholeOutput).toMatch(fleetJsonPattern);
      });

      it('VALID: {--human, dungeonmaster siegelense status} => the rendered table, killed then live', async () => {
        const writes: ReturnType<typeof ContentTextStub>[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);
        process.stdout.write = ((chunk: string): boolean => {
          writes.push(ContentTextStub({ value: chunk }));
          return true;
        }) as unknown as typeof process.stdout.write;

        // SiegelenseFlow does not parse --human yet — that wiring is SiegelenseFlow's own route
        // table, a later work item — so this calls the responder it would route to directly.
        await SiegelenseStatusResponder({ instanceId: null, human: true });

        process.stdout.write = originalWrite;

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

  // The read path above proves resultsReadBroker/statusReadBroker/compareReadBroker/
  // cleanupRunBroker are correct by calling them directly. This block drives the SAME evidence
  // tree through SiegelenseFlow({ args }) instead — the parse, the route, the responder, the
  // output format and the refusal are all new with chunk 4, and none of them is exercised by a
  // direct broker call (chunk-04-cli-surface.md, W17).
  //
  // `start`, `run` and `kill` get NO integration test here. They need a live driver and this
  // suite deliberately has none — no port pair, no spawned process. Their coverage is
  // `siegelense-start-responder.test.ts`, `siegelense-run-responder.test.ts` and
  // `siegelense-kill-responder.test.ts` (each colocated under its own
  // `responders/siegelense/<call>/`, argv already parsed into typed params) plus the manual
  // drive in `scrolls/seigelense/plans/chunk-04-cli-surface.md` §8 for the argv-and-driver slice
  // this suite cannot reach.
  describe('the seven calls, through argv — SiegelenseFlow rather than the brokers (chunk 4)', () => {
    const argvTree = evidenceTreeHarness();

    describe('results', () => {
      it('VALID: {args: results --instance <killed> --run run_1} => the stored RunResult, byte-identical to what the broker itself returns', async () => {
        const expectedAnswer = await argvTree.readResults({
          query: ResultsQueryStub({
            instanceId: argvTree.killedInstanceId(),
            runId: argvTree.runOne(),
          }),
        });

        const writes: ReturnType<typeof ContentTextStub>[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);
        process.stdout.write = ((chunk: string): boolean => {
          writes.push(ContentTextStub({ value: chunk }));
          return true;
        }) as unknown as typeof process.stdout.write;

        await SiegelenseFlow({
          args: ['results', '--instance', argvTree.killedInstanceId(), '--run', argvTree.runOne()],
        });

        process.stdout.write = originalWrite;

        const [wholeOutput] = writes;

        expect(wholeOutput).toBe(
          `${JSON.stringify(expectedAnswer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
        );
      });

      it('VALID: {args: results --instance <killed> --run run_1 --kind console --step 2} => only step 2 entries, matching the broker', async () => {
        const expectedAnswer = await argvTree.readResults({
          query: ResultsQueryStub({
            instanceId: argvTree.killedInstanceId(),
            runId: argvTree.runOne(),
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

        await SiegelenseFlow({
          args: [
            'results',
            '--instance',
            argvTree.killedInstanceId(),
            '--run',
            argvTree.runOne(),
            '--kind',
            'console',
            '--step',
            '2',
          ],
        });

        process.stdout.write = originalWrite;

        const [wholeOutput] = writes;

        expect(JSON.parse(wholeOutput!)).toStrictEqual(expectedAnswer);
      });

      it('VALID: {args: results --instance <killed> --run run_1 --kind screenshots} => the shot row matches the broker, and its path is absolute', async () => {
        const expectedAnswer = await argvTree.readResults({
          query: ResultsQueryStub({
            instanceId: argvTree.killedInstanceId(),
            runId: argvTree.runOne(),
            kind: 'screenshots',
          }),
        });

        const writes: ReturnType<typeof ContentTextStub>[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);
        process.stdout.write = ((chunk: string): boolean => {
          writes.push(ContentTextStub({ value: chunk }));
          return true;
        }) as unknown as typeof process.stdout.write;

        await SiegelenseFlow({
          args: [
            'results',
            '--instance',
            argvTree.killedInstanceId(),
            '--run',
            argvTree.runOne(),
            '--kind',
            'screenshots',
          ],
        });

        process.stdout.write = originalWrite;

        const [wholeOutput] = writes;

        expect(JSON.parse(wholeOutput!)).toStrictEqual(expectedAnswer);

        // The absolute-path invariant, repeated on the argv-driven answer: a shot path a reader's
        // `Read` cannot reach hands back nothing. Decoded whole (never a single `.path` access on
        // an unvalidated JSON.parse result) and compared against the harness's own accessor, which
        // is itself an absolute path under the testbed's temp dir.
        expect(expectedAnswer.rows.map((row) => JSON.parse(row))).toStrictEqual([
          {
            step: 1,
            path: argvTree.run1Shot1Path(),
            open: true,
            why: 'blank',
            node: null,
            pixelChange: null,
            blank: true,
            blankColour: '#0d0907',
          },
        ]);
        expect(argvTree.run1Shot1Path().startsWith('/')).toBe(true);
      });

      it('ERROR: {args: results --instance <killed>, no --run and no --since} => rejects carrying RunIdRequiredError and its exact message, and never writes to stdout', async () => {
        const writes: ReturnType<typeof ContentTextStub>[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);
        process.stdout.write = ((chunk: string): boolean => {
          writes.push(ContentTextStub({ value: chunk }));
          return true;
        }) as unknown as typeof process.stdout.write;

        await expect(
          SiegelenseFlow({ args: ['results', '--instance', argvTree.killedInstanceId()] }),
        ).rejects.toThrow(RunIdRequiredError);
        await expect(
          SiegelenseFlow({ args: ['results', '--instance', argvTree.killedInstanceId()] }),
        ).rejects.toThrow(
          new RunIdRequiredError({
            instanceId: argvTree.killedInstanceId(),
            instanceState: 'killed',
            runCount: 2,
          }),
        );

        process.stdout.write = originalWrite;

        expect(writes).toStrictEqual([]);
      });

      it('ERROR: {args: results --instance <killed> --since boot, no --kind} => refuses naming the sinceBoot-eligible kinds, and never writes to stdout', async () => {
        const writes: ReturnType<typeof ContentTextStub>[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);
        process.stdout.write = ((chunk: string): boolean => {
          writes.push(ContentTextStub({ value: chunk }));
          return true;
        }) as unknown as typeof process.stdout.write;

        await expect(
          SiegelenseFlow({
            args: ['results', '--instance', argvTree.killedInstanceId(), '--since', 'boot'],
          }),
        ).rejects.toThrow(
          new RegExp(
            `^results against instance ${argvTree.killedInstanceId()} with since: 'boot' and no ` +
              `kind cannot answer: boot spans every run, and only console, network, ws hold lines ` +
              `for the whole timeline\\. Name one with --kind <kind>, or drop --since boot to read ` +
              `a single run's steps, server or screenshots\\.$`,
            'u',
          ),
        );

        process.stdout.write = originalWrite;

        expect(writes).toStrictEqual([]);
      });
    });

    describe('compare', () => {
      it('VALID: {args: compare --instance <killed> --run-a run_1 --run-b run_2} => the CompareAnswer, matching what the broker itself returns', async () => {
        const expectedAnswer = await argvTree.readCompare({
          query: CompareQueryStub({
            instanceId: argvTree.killedInstanceId(),
            runA: argvTree.runOne(),
            runB: argvTree.runTwo(),
          }),
        });

        const writes: ReturnType<typeof ContentTextStub>[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);
        process.stdout.write = ((chunk: string): boolean => {
          writes.push(ContentTextStub({ value: chunk }));
          return true;
        }) as unknown as typeof process.stdout.write;

        await SiegelenseFlow({
          args: [
            'compare',
            '--instance',
            argvTree.killedInstanceId(),
            '--run-a',
            argvTree.runOne(),
            '--run-b',
            argvTree.runTwo(),
          ],
        });

        process.stdout.write = originalWrite;

        const [wholeOutput] = writes;

        expect(JSON.parse(wholeOutput!)).toStrictEqual(expectedAnswer);
      });

      it('INVALID: {args: compare --instance-a X --instance-b Y} => rejects naming both flags and stating there is no cross-instance form', async () => {
        await expect(
          SiegelenseFlow({
            args: [
              'compare',
              '--instance-a',
              argvTree.killedInstanceId(),
              '--instance-b',
              argvTree.liveInstanceId(),
            ],
          }),
        ).rejects.toThrow(
          /^--instance-a and --instance-b are not accepted: there is no cross-instance form\. Name one --instance and two runs \(--run-a, --run-b\) inside its own timeline — two different instances share nothing but a spec\.$/u,
        );
      });
    });

    describe('status', () => {
      it('VALID: {args: status --instance <an id the registry never held>} => the default JSON names it "unknown", byte-identical to the read path\'s own answer for the same id', async () => {
        const writes: ReturnType<typeof ContentTextStub>[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);
        process.stdout.write = ((chunk: string): boolean => {
          writes.push(ContentTextStub({ value: chunk }));
          return true;
        }) as unknown as typeof process.stdout.write;

        await SiegelenseFlow({ args: ['status', '--instance', argvTree.unknownInstanceId()] });

        process.stdout.write = originalWrite;

        const [wholeOutput] = writes;
        const withoutLiveMachineBlock = wholeOutput!.replace(
          / {2}"machine": \{[\s\S]*?\n {2}\},\n/u,
          '',
        );

        expect(withoutLiveMachineBlock).toBe(UNKNOWN_NAMED_STATUS_JSON);
      });

      it('VALID: {args: status --human} => the rendered table, killed then live', async () => {
        const writes: ReturnType<typeof ContentTextStub>[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);
        process.stdout.write = ((chunk: string): boolean => {
          writes.push(ContentTextStub({ value: chunk }));
          return true;
        }) as unknown as typeof process.stdout.write;

        await SiegelenseFlow({ args: ['status', '--human'] });

        process.stdout.write = originalWrite;

        const [wholeOutput] = writes;
        const lines = wholeOutput!.split('\n');

        expect(lines.slice(2, 4)).toStrictEqual([
          'ID\tSTATE\tSPEC\tUPTIME\tLAST BEAT\tRUNS\tRSS\tORPHANS',
          `${argvTree.killedInstanceId()}\tkilled\tdungeonmaster-web\t-\t-\t2\t1840MB\t0`,
        ]);
      });
    });

    describe('cleanup', () => {
      it('VALID: {args: cleanup} => a real stale registry row reaped, a real live row left alone', async () => {
        const staleId = await argvTree.addStaleAliveEntry();

        const writes: ReturnType<typeof ContentTextStub>[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);
        process.stdout.write = ((chunk: string): boolean => {
          writes.push(ContentTextStub({ value: chunk }));
          return true;
        }) as unknown as typeof process.stdout.write;

        await SiegelenseFlow({ args: ['cleanup'] });

        process.stdout.write = originalWrite;

        const [wholeOutput] = writes;

        expect(JSON.parse(wholeOutput!)).toStrictEqual({
          reaped: [
            {
              id: staleId,
              staleFor: expect.stringMatching(/^\d+m$/u),
              killed: [argvTree.fakePgid()],
              homeRemoved: true,
            },
          ],
          portsReleased: [40_021, 40_022],
          lockReleased: false,
          leftAlone: [
            {
              id: argvTree.liveInstanceId(),
              why: expect.stringMatching(/^live — last beat \d+s ago$/u),
            },
          ],
        });
      });
    });
  });
});
