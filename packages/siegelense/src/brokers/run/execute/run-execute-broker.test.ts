import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { StepExpectationStub } from '../../../contracts/step-expectation/step-expectation.stub';
import { StepIndexStub } from '../../../contracts/step-index/step-index.stub';
import { StepStub } from '../../../contracts/step/step.stub';
import { StopOnStub } from '../../../contracts/stop-on/stop-on.stub';
import { UrlPathStub } from '../../../contracts/url-path/url-path.stub';
import { locationsShotPathFindBroker } from '../../locations/shot-path-find/locations-shot-path-find-broker';

import { runExecuteBroker } from './run-execute-broker';
import { runExecuteBrokerProxy } from './run-execute-broker.proxy';

const gotoBatch = ({ count }: { count: number }): ReturnType<typeof StepStub>[] =>
  Array.from({ length: count }, (_unused, position) =>
    StepStub({ step: 'goto', path: UrlPathStub({ value: `/step-${String(position + 1)}` }) }),
  );

const gotoBatchWithExpectationAtThree = ({
  stepExpectation,
}: {
  stepExpectation: ReturnType<typeof StepExpectationStub>;
}): ReturnType<typeof StepStub>[] => [
  StepStub({ step: 'goto', path: UrlPathStub({ value: '/step-1' }) }),
  StepStub({ step: 'goto', path: UrlPathStub({ value: '/step-2' }) }),
  StepStub({ step: 'goto', path: UrlPathStub({ value: '/step-3' }), expect: stepExpectation }),
  StepStub({ step: 'goto', path: UrlPathStub({ value: '/step-4' }) }),
  StepStub({ step: 'goto', path: UrlPathStub({ value: '/step-5' }) }),
];

describe('runExecuteBroker', () => {
  describe('a clean batch', () => {
    it('VALID: {five ok steps} => status done, stepsRun 5, stoppedAt null', async () => {
      const proxy = runExecuteBrokerProxy();
      const runId = RunIdStub({ value: 'run_1' });
      proxy.stagePaths({ runId });
      const lane = proxy.cleanLane();

      const result = await runExecuteBroker({
        lane,
        instanceId: InstanceIdStub(),
        runId,
        steps: gotoBatch({ count: 5 }),
        stopOn: StopOnStub({ value: 'error' }),
      });

      expect({
        status: result.status,
        stepsRun: result.stepsRun,
        stoppedAt: result.stoppedAt,
      }).toStrictEqual({
        status: 'done',
        stepsRun: 5,
        stoppedAt: null,
      });
    });
  });

  describe('a failing step, default stopOn', () => {
    it('VALID: {step 3 fails, stopOn error} => status failed, stepsRun 3, stoppedAt names step 3 and its verb, steps 4 and 5 never dispatched', async () => {
      const proxy = runExecuteBrokerProxy();
      const runId = RunIdStub({ value: 'run_1' });
      proxy.stagePaths({ runId });
      const { lane, gotoCallCount } = proxy.laneFailingOnPath({
        failingPath: '/step-3',
        error: new Error('AMBIGUOUS: 2 elements match [data-testid="X"]'),
      });

      const result = await runExecuteBroker({
        lane,
        instanceId: InstanceIdStub(),
        runId,
        steps: gotoBatch({ count: 5 }),
        stopOn: StopOnStub({ value: 'error' }),
      });

      expect({
        status: result.status,
        stepsRun: result.stepsRun,
        stoppedAt: result.stoppedAt,
      }).toStrictEqual({
        status: 'failed',
        stepsRun: 3,
        stoppedAt: {
          step: 3,
          verb: 'goto',
          error: 'AMBIGUOUS: 2 elements match [data-testid="X"]',
          candidates: [],
        },
      });
      expect(gotoCallCount()).toBe(3);
    });
  });

  describe('a failing step, stopOn never', () => {
    it('VALID: {step 3 fails, stopOn never} => status failed, stepsRun 5, and the later steps DO run', async () => {
      const proxy = runExecuteBrokerProxy();
      const runId = RunIdStub({ value: 'run_1' });
      proxy.stagePaths({ runId });
      const { lane, gotoCallCount } = proxy.laneFailingOnPath({
        failingPath: '/step-3',
        error: new Error('boom'),
      });

      const result = await runExecuteBroker({
        lane,
        instanceId: InstanceIdStub(),
        runId,
        steps: gotoBatch({ count: 5 }),
        stopOn: StopOnStub({ value: 'never' }),
      });

      expect({ status: result.status, stepsRun: result.stepsRun }).toStrictEqual({
        status: 'failed',
        stepsRun: 5,
      });
      expect(gotoCallCount()).toBe(5);
    });
  });

  describe('an expect: error step that fails as intended', () => {
    it('VALID: {step 3 declares expect error and fails} => the batch never stops on it', async () => {
      const proxy = runExecuteBrokerProxy();
      const runId = RunIdStub({ value: 'run_1' });
      proxy.stagePaths({ runId });
      const { lane, gotoCallCount } = proxy.laneFailingOnPath({
        failingPath: '/step-3',
        error: new Error('boom'),
      });

      const result = await runExecuteBroker({
        lane,
        instanceId: InstanceIdStub(),
        runId,
        steps: gotoBatchWithExpectationAtThree({
          stepExpectation: StepExpectationStub({ value: 'error' }),
        }),
        stopOn: StopOnStub({ value: 'error' }),
      });

      expect({ status: result.status, stepsRun: result.stepsRun }).toStrictEqual({
        status: 'done',
        stepsRun: 5,
      });
      expect(gotoCallCount()).toBe(5);
    });
  });

  describe('an expect: error step that succeeds instead', () => {
    it('INVALID: {step 3 declares expect error and succeeds} => reported as a finding that stops the batch', async () => {
      const proxy = runExecuteBrokerProxy();
      const runId = RunIdStub({ value: 'run_1' });
      proxy.stagePaths({ runId });
      const lane = proxy.cleanLane();

      const result = await runExecuteBroker({
        lane,
        instanceId: InstanceIdStub(),
        runId,
        steps: gotoBatchWithExpectationAtThree({
          stepExpectation: StepExpectationStub({ value: 'error' }),
        }),
        stopOn: StopOnStub({ value: 'error' }),
      });

      expect({
        status: result.status,
        stepsRun: result.stepsRun,
        stoppedAt: result.stoppedAt,
      }).toStrictEqual({
        status: 'failed',
        stepsRun: 3,
        stoppedAt: {
          step: 3,
          verb: 'goto',
          error: "step 3 (goto) declared expect: 'error' but succeeded: /step-3",
          candidates: [],
        },
      });
    });
  });

  describe('a timeout-shaped failure', () => {
    it('VALID: {step 2 times out} => status timeout, stoppedAt carries the step, the verb and the full message', async () => {
      const proxy = runExecuteBrokerProxy();
      const runId = RunIdStub({ value: 'run_1' });
      proxy.stagePaths({ runId });
      const { lane } = proxy.laneFailingOnPath({
        failingPath: '/step-2',
        error: new Error(
          'step 2 waitFor on [data-testid="SUBAGENT_CHAIN"] never resolved after 10000ms: Timeout 10000ms exceeded',
        ),
      });

      const result = await runExecuteBroker({
        lane,
        instanceId: InstanceIdStub(),
        runId,
        steps: gotoBatch({ count: 5 }),
        stopOn: StopOnStub({ value: 'error' }),
      });

      expect({ status: result.status, stoppedAt: result.stoppedAt }).toStrictEqual({
        status: 'timeout',
        stoppedAt: {
          step: 2,
          verb: 'goto',
          error:
            'step 2 waitFor on [data-testid="SUBAGENT_CHAIN"] never resolved after 10000ms: Timeout 10000ms exceeded',
          candidates: [],
        },
      });
    });
  });

  describe('the transcript, flushed per step', () => {
    it('VALID: {five steps} => step N is dispatched only once the previous N-1 lines are already flushed', async () => {
      const proxy = runExecuteBrokerProxy();
      const runId = RunIdStub({ value: 'run_1' });
      const { transcript } = proxy.stagePaths({ runId });
      const { lane, snapshotsAtEachStep } = proxy.laneRecordingTranscriptGrowth({
        transcriptPath: transcript,
      });

      await runExecuteBroker({
        lane,
        instanceId: InstanceIdStub(),
        runId,
        steps: gotoBatch({ count: 5 }),
        stopOn: StopOnStub({ value: 'error' }),
      });

      // Five snapshots, one per step, each equal to the number of lines already flushed the
      // instant THAT step's own action fired — [0,1,2,3,4] is a stronger proof than a final tally
      // ever could be: a buffered implementation would report the SAME total ([0,0,0,0,0], all
      // taken before anything was written) rather than growing one entry at a time.
      expect(snapshotsAtEachStep()).toStrictEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('the stored return', () => {
    it('VALID: {a completed run} => the whole RunResult is written to runs/run_N.json', async () => {
      const proxy = runExecuteBrokerProxy();
      const runId = RunIdStub({ value: 'run_1' });
      const { storedReturn } = proxy.stagePaths({ runId });
      const lane = proxy.cleanLane();

      const result = await runExecuteBroker({
        lane,
        instanceId: InstanceIdStub(),
        runId,
        steps: gotoBatch({ count: 2 }),
        stopOn: StopOnStub({ value: 'error' }),
      });

      expect(proxy.storedReturnWrite({ storedReturnPath: storedReturn })).toBe(
        `${JSON.stringify(result)}\n`,
      );
    });
  });

  describe('two runs on one lane', () => {
    it('VALID: {run_1 then run_2} => the second run restarts step numbering at 1 and its shots are under runs/run_2/', async () => {
      const proxy = runExecuteBrokerProxy();
      const firstRunId = RunIdStub({ value: 'run_1' });
      const secondRunId = RunIdStub({ value: 'run_2' });
      proxy.stagePaths({ runId: firstRunId });
      const secondPaths = proxy.stagePaths({ runId: secondRunId });
      const firstLane = proxy.cleanLane();
      const secondLane = proxy.cleanLane();

      await runExecuteBroker({
        lane: firstLane,
        instanceId: InstanceIdStub(),
        runId: firstRunId,
        steps: gotoBatch({ count: 2 }),
        stopOn: StopOnStub({ value: 'error' }),
      });
      const secondResult = await runExecuteBroker({
        lane: secondLane,
        instanceId: InstanceIdStub(),
        runId: secondRunId,
        steps: gotoBatch({ count: 2 }),
        stopOn: StopOnStub({ value: 'error' }),
      });

      const expectedFirstShotPath = locationsShotPathFindBroker({
        shotsDir: secondPaths.shotsDir,
        step: StepIndexStub({ value: 1 }),
      });
      const expectedSecondShotPath = locationsShotPathFindBroker({
        shotsDir: secondPaths.shotsDir,
        step: StepIndexStub({ value: 2 }),
      });

      expect({
        stepsRun: secondResult.stepsRun,
        shots: secondResult.shots.map((shot) => [shot.step, shot.path]),
      }).toStrictEqual({
        stepsRun: 2,
        shots: [
          [1, expectedFirstShotPath],
          [2, expectedSecondShotPath],
        ],
      });
    });
  });

  describe('an instance with history from an earlier run', () => {
    it('VALID: {run 2 index} => counts only the lines that arrived after run 1 ended, not the total', async () => {
      const proxy = runExecuteBrokerProxy();
      const runId = RunIdStub({ value: 'run_2' });
      proxy.stagePaths({ runId });
      const lane = proxy.laneWithBrowserHistory({
        consoleStart: ReadingCountStub({ value: 10 }),
        networkStart: ReadingCountStub({ value: 3 }),
        newConsoleLines: [
          ContentTextStub({
            value: JSON.stringify({
              at: 1,
              kind: 'console',
              type: 'error',
              text: 'x',
              url: '',
              line: 0,
            }),
          }),
        ],
        newNetworkLines: [],
      });

      const result = await runExecuteBroker({
        lane,
        instanceId: InstanceIdStub(),
        runId,
        steps: gotoBatch({ count: 1 }),
        stopOn: StopOnStub({ value: 'error' }),
      });

      expect(result.index.console).toStrictEqual({ errors: 1, warnings: 0 });
    });
  });

  describe('shot policy on a clean run', () => {
    it('VALID: {five ok steps} => first and last shots open, middles closed', async () => {
      const proxy = runExecuteBrokerProxy();
      const runId = RunIdStub({ value: 'run_1' });
      proxy.stagePaths({ runId });
      const lane = proxy.cleanLane();

      const result = await runExecuteBroker({
        lane,
        instanceId: InstanceIdStub(),
        runId,
        steps: gotoBatch({ count: 5 }),
        stopOn: StopOnStub({ value: 'error' }),
      });

      expect(result.shots.map((shot) => [shot.step, shot.open, shot.why])).toStrictEqual([
        [1, true, 'start'],
        [2, false, null],
        [3, false, null],
        [4, false, null],
        [5, true, 'end'],
      ]);
    });
  });

  describe('shot policy on a failing run', () => {
    it("VALID: {step 3 declares expect error and succeeds} => the failing step's shot is open with why 'failed'", async () => {
      const proxy = runExecuteBrokerProxy();
      const runId = RunIdStub({ value: 'run_1' });
      proxy.stagePaths({ runId });
      const lane = proxy.cleanLane();

      const result = await runExecuteBroker({
        lane,
        instanceId: InstanceIdStub(),
        runId,
        steps: gotoBatchWithExpectationAtThree({
          stepExpectation: StepExpectationStub({ value: 'error' }),
        }),
        stopOn: StopOnStub({ value: 'never' }),
      });

      expect(result.shots.map((shot) => [shot.step, shot.open, shot.why])).toStrictEqual([
        [1, true, 'start'],
        [2, false, null],
        [3, true, 'failed'],
        [4, false, null],
        [5, true, 'end'],
      ]);
    });
  });
});
