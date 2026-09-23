/**
 * PURPOSE: Covers ONLY what belongs to the router itself, not to any one of the thirteen
 * `dungeonmaster siegelense` subcommands: the `--help` surface (bare, and after a call name), the
 * `driver` call (outside the thirteen-command surface), the three-way fall-through for an
 * unrecognised `args[0]` (a closed-set name with no route, an unknown name, and absent args), and
 * dispatch — that a given `args[0]` reaches the right layer flow. Per-flag behaviour, per-command
 * refusals, rendered output and `--json` shapes belong to each command's own
 * `siegelense-<call>-layer-flow.integration.test.ts`, colocated in this same folder. A handful of
 * cases below still exercise one command's read path directly, off a real `evidenceTreeHarness`
 * tree — kept here because no layer-flow test independently re-proves the same literal broker
 * output (a layer-flow test proves the argv PARSE produces the right query, not that the query's
 * answer is correct — see each layer-flow file's own PURPOSE header).
 *
 * USAGE:
 * await SiegelenseFlow({ args: ['--help'] });
 * // Writes the index page listing every subcommand
 */

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
import { machineStatics } from '../../statics/machine/machine-statics';
import { siegelenseCallStatics } from '../../statics/siegelense-call/siegelense-call-statics';
import { siegelenseHelpStatics } from '../../statics/siegelense-help/siegelense-help-statics';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { siegelenseHelpRenderTransformer } from '../../transformers/siegelense-help-render/siegelense-help-render-transformer';
import { evidenceTreeHarness } from '../../../test/harnesses/evidence-tree/evidence-tree.harness';
import { recipesRouteOutcomeHarness } from '../../../test/harnesses/recipes-route-outcome/recipes-route-outcome.harness';
import { SiegelenseFlow } from './siegelense-flow';

// Every built call, in the order `siegelenseHelpStatics.calls` declares them — every it.each
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
    it('VALID: {args: ["status"]} => routes to the status responder and reports an empty fleet in human format by default', async () => {
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

    it('VALID: {args: ["status", "--json"]} => routes to the status responder and reports an empty fleet as one JSON document when --json is passed', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseFlow({ args: ['status', '--json'] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;
      const withoutLiveMachineBlock = wholeOutput!.replace(
        / {2}"machine": \{[\s\S]*?\n {2}\},\n/u,
        '',
      );

      expect(withoutLiveMachineBlock).toBe(EMPTY_FLEET_STATUS_JSON);
    });
  });

  describe('the cleanup route', () => {
    it('VALID: {args: ["cleanup"]} => routes to the cleanup responder and reports nothing reaped as the rendered human table by default', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseFlow({ args: ['cleanup'] });

      process.stdout.write = originalWrite;

      expect(writes).toStrictEqual([
        'REAPED: none\n' +
          'PORTS RELEASED: none\n' +
          'LOCK RELEASED: no\n' +
          'ASSETS AGED: 0 instances, 0MB\n' +
          'LEFT ALONE: none\n',
      ]);
    });

    it('VALID: {args: ["cleanup", "--json"]} => routes to the cleanup responder and reports nothing reaped as one JSON document', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseFlow({ args: ['cleanup', '--json'] });

      process.stdout.write = originalWrite;

      const expectedAnswer = CleanupAnswerStub({
        reaped: [],
        portsReleased: [],
        lockReleased: false,
        assetsAged: { instances: 0, freedMB: 0 },
        leftAlone: [],
      });

      expect(writes).toStrictEqual([
        `${JSON.stringify(expectedAnswer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  // `packages/hydration-recipes/dist/index.js` is compiled output from a sibling package this
  // chunk does not build, so `recipesLocateBroker` (C2) — real fs I/O against that exact path —
  // resolves or rejects differently depending on that package's own build state. What holds in
  // EITHER state, and what this test asserts: bare `recipes` always reaches the real recipes
  // pipeline, never SiegelenseFlow's own "is a siegelense call but is not built yet" fall-through —
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
  });

  describe('an unknown subcommand', () => {
    it('INVALID: {args: [statuss]} => rejects naming the unknown subcommand instead of falling back to the fleet listing', async () => {
      await expect(SiegelenseFlow({ args: ['statuss'] })).rejects.toThrow(
        /^Unknown siegelense subcommand: statuss\n\nUsage: dungeonmaster siegelense \[--help \| start \| run \| results \| kill \| capacity \| status \| cleanup \| prune \| compare \| profile \| snapshots \| recipes \| docs \| driver --instance <instanceId>\]$/u,
      );
    });
  });

  describe('the not-built-yet branch, now unreachable', () => {
    // The branch itself stays, as the guard for a fourteenth name added to the closed set with no
    // route. These two assertions prove no CURRENT name reaches it — they replace the old
    // `capacity refuses by name` case, which could only pass while capacity was unbuilt.
    it('VALID: {every name siegelenseCallStatics defines} => has a route, so none answers "not built yet"', async () => {
      const outcomes = await Promise.all(
        siegelenseCallStatics.calls.names.map(async (name) =>
          SiegelenseFlow({ args: [name, '--help'] }).then(
            () => null,
            () => name,
          ),
        ),
      );

      expect(outcomes.filter((name) => name !== null)).toStrictEqual([]);
    });

    it('VALID: {index.notBuiltYet} => empty, matching the route table it is graded against', () => {
      expect(siegelenseHelpStatics.index.notBuiltYet).toStrictEqual([]);
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
    it('INVALID: {args: [results, --human]} => rejects --human as an unknown flag', async () => {
      await expect(SiegelenseFlow({ args: ['results', '--human'] })).rejects.toThrow(
        /^Unknown flag: --human/u,
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

  // Chunk 3's read path: results/status/compare resolve off a REAL evidence tree, with no driver,
  // no browser and no port pair (chunk-03-read-path-and-perception.md §1). `tree`'s own
  // beforeEach/afterEach mint a fresh testbed and DUNGEONMASTER_HOME per test, isolated from the
  // routing tests above and from each other, so the crash variant's deleted stored return never
  // leaks between tests.
  describe('the read path — results, status, compare (chunk 3)', () => {
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
          elements: { runA: null, runB: null },
        });
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

      it('VALID: {dungeonmaster siegelense status --json through SiegelenseFlow} => the fleet as one JSON document, killed then live', async () => {
        const writes: ReturnType<typeof ContentTextStub>[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);
        process.stdout.write = ((chunk: string): boolean => {
          writes.push(ContentTextStub({ value: chunk }));
          return true;
        }) as unknown as typeof process.stdout.write;

        await SiegelenseFlow({ args: ['status', '--json'] });

        process.stdout.write = originalWrite;

        // A single SiegelenseFlow({args: ['status', '--json']}) call makes exactly one
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

      it('VALID: {dungeonmaster siegelense status through SiegelenseFlow} => the rendered table by default, killed then live', async () => {
        const writes: ReturnType<typeof ContentTextStub>[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);
        process.stdout.write = ((chunk: string): boolean => {
          writes.push(ContentTextStub({ value: chunk }));
          return true;
        }) as unknown as typeof process.stdout.write;

        await SiegelenseFlow({ args: ['status'] });

        process.stdout.write = originalWrite;

        const [wholeOutput] = writes;
        const lines = wholeOutput!.split('\n');

        expect(lines.slice(2, 6)).toStrictEqual([
          '┌───────────────┬────────┬─────────────────────┬────────┬────────┬───────────┬──────┬────────┬─────────┐',
          '│ ID            │ STATE  │ SPEC                │ BRANCH │ UPTIME │ LAST BEAT │ RUNS │ RSS    │ ORPHANS │',
          '├───────────────┼────────┼─────────────────────┼────────┼────────┼───────────┼──────┼────────┼─────────┤',
          `│ ${tree.killedInstanceId()} │ killed │ dungeonmaster-stack │ -      │ -      │ -         │ 2    │ 1840MB │ 0       │`,
        ]);
      });
    });
  });

  // The read path above proves resultsReadBroker/statusReadBroker/compareReadBroker are correct
  // by calling them directly. This block drives the SAME evidence tree through
  // SiegelenseFlow({ args }) instead, for the one case no layer-flow test independently re-proves:
  // status's table render against a LIVE row with a real RSS value, which widens the RSS column
  // past what any `siegelense-status-layer-flow.integration.test.ts` fixture (every row `killed`,
  // RSS always `-`) can produce.
  //
  // `start`, `run` and `kill` get NO integration test here. They need a live driver and this
  // suite deliberately has none — no port pair, no spawned process. Their coverage is
  // `siegelense-start-responder.test.ts`, `siegelense-run-responder.test.ts` and
  // `siegelense-kill-responder.test.ts` (each colocated under its own
  // `responders/siegelense/<call>/`, argv already parsed into typed params) plus the manual
  // drive in `scrolls/seigelense/plans/chunk-04-cli-surface.md` §8 for the argv-and-driver slice
  // this suite cannot reach.
  describe('status, through argv — SiegelenseFlow rather than the broker', () => {
    const argvTree = evidenceTreeHarness();

    it('VALID: {args: status} => the rendered table by default, killed then live', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseFlow({ args: ['status'] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;
      const lines = wholeOutput!.split('\n');

      expect(lines.slice(2, 6)).toStrictEqual([
        '┌───────────────┬────────┬─────────────────────┬────────┬────────┬───────────┬──────┬────────┬─────────┐',
        '│ ID            │ STATE  │ SPEC                │ BRANCH │ UPTIME │ LAST BEAT │ RUNS │ RSS    │ ORPHANS │',
        '├───────────────┼────────┼─────────────────────┼────────┼────────┼───────────┼──────┼────────┼─────────┤',
        `│ ${argvTree.killedInstanceId()} │ killed │ dungeonmaster-stack │ -      │ -      │ -         │ 2    │ 1840MB │ 0       │`,
      ]);
    });
  });
});
