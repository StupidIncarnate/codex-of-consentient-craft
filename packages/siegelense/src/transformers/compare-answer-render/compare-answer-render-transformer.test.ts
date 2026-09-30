import { CompareAnswerStub } from '../../contracts/compare-answer/compare-answer.stub';
import { ElementDeltaStub } from '../../contracts/element-delta/element-delta.stub';
import { InstanceIdStub } from '../../contracts/instance-id/instance-id.stub';
import { KeyRowStub } from '../../contracts/key-row/key-row.stub';
import { RunIdStub } from '../../contracts/run-id/run-id.stub';
import { compareAnswerRenderTransformer } from './compare-answer-render-transformer';

const NOT_COMPARED =
  "ELEMENTS: not compared between the two runs (each run's own last element delta is in --json)";

describe('compareAnswerRenderTransformer', () => {
  describe('standard compare answer', () => {
    it('VALID: {runs, deltas, no new lines, pixels string} => renders concise human view', () => {
      const answer = CompareAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        runA: RunIdStub({ value: 'run_4' }),
        runB: RunIdStub({ value: 'run_5' }),
        console: {
          errors: '+2',
          new: [],
        },
        server: {
          errors: '+0',
          new: [],
        },
        network: {
          errors: '+1',
          new: [],
        },
        pixels: 'last capture differs 12% (run_4: /r/run_4/step1.png, run_5: /r/run_5/step1.png)',
        elements: { runA: null, runB: null },
      });

      const rendered = compareAnswerRenderTransformer({ answer });

      expect(rendered).toBe(
        `INSTANCE: inst_7f3a9c21\nCOMPARING: run_4 -> run_5\nCONSOLE ERRORS: +2\nSERVER ERRORS: +0\nNETWORK NON-2XX: +1\nPIXEL DELTA: last capture differs 12% (run_4: /r/run_4/step1.png, run_5: /r/run_5/step1.png)\n${NOT_COMPARED}\n`,
      );
    });
  });

  describe('new lines', () => {
    it('VALID: {3 new console errors, 1 new server error, 2 new failed requests} => lists each one under its count', () => {
      const answer = CompareAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        runA: RunIdStub({ value: 'run_16' }),
        runB: RunIdStub({ value: 'run_33' }),
        console: {
          errors: '+3',
          new: ['GET /api/guilds 500', 'GET /api/quests/queue 500', 'use-quest-queue failed'],
        },
        server: {
          errors: '+1',
          new: ['ENOENT guilds.json'],
        },
        network: {
          errors: '+2',
          new: ['GET /api/guilds 500', 'GET /api/quests/queue 500'],
        },
        pixels: null,
        elements: { runA: null, runB: null },
      });

      const rendered = compareAnswerRenderTransformer({ answer });

      expect(rendered).toBe(
        `INSTANCE: inst_7f3a9c21\nCOMPARING: run_16 -> run_33\nCONSOLE ERRORS: +3\n  GET /api/guilds 500\n  GET /api/quests/queue 500\n  use-quest-queue failed\nSERVER ERRORS: +1\n  ENOENT guilds.json\nNETWORK NON-2XX: +2\n  GET /api/guilds 500\n  GET /api/quests/queue 500\nPIXEL DELTA: none\n${NOT_COMPARED}\n`,
      );
    });

    it('EDGE: {7 new console errors, cap 5} => lists the first 5 and names the 2 left in --json', () => {
      const answer = CompareAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        runA: RunIdStub({ value: 'run_4' }),
        runB: RunIdStub({ value: 'run_5' }),
        console: {
          errors: '+7',
          new: Array.from({ length: 7 }, (_unused, index) => `error ${String(index + 1)}`),
        },
        server: { errors: '+0', new: [] },
        network: { errors: '+0', new: [] },
        pixels: null,
        elements: { runA: null, runB: null },
      });

      const rendered = compareAnswerRenderTransformer({ answer });

      expect(rendered).toBe(
        `INSTANCE: inst_7f3a9c21\nCOMPARING: run_4 -> run_5\nCONSOLE ERRORS: +7\n  error 1\n  error 2\n  error 3\n  error 4\n  error 5\n  ... 2 more in --json\nSERVER ERRORS: +0\nNETWORK NON-2XX: +0\nPIXEL DELTA: none\n${NOT_COMPARED}\n`,
      );
    });
  });

  describe('no pixel diff took place', () => {
    it('VALID: {pixels: null} => renders PIXEL DELTA: none', () => {
      const answer = CompareAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        runA: RunIdStub({ value: 'run_4' }),
        runB: RunIdStub({ value: 'run_5' }),
        pixels: null,
        elements: { runA: null, runB: null },
      });

      const rendered = compareAnswerRenderTransformer({ answer });

      expect(rendered).toBe(
        `INSTANCE: inst_7f3a9c21\nCOMPARING: run_4 -> run_5\nCONSOLE ERRORS: +2\n  Cannot read properties of null\nSERVER ERRORS: +0\nNETWORK NON-2XX: +1\n  POST /api/guilds 500\nPIXEL DELTA: none\n${NOT_COMPARED}\n`,
      );
    });
  });

  describe('explicit pixelDiffCount provided', () => {
    it('VALID: {pixelDiffCount: 42} => renders pixel count changed message', () => {
      const answer = CompareAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        runA: RunIdStub({ value: 'run_4' }),
        runB: RunIdStub({ value: 'run_5' }),
        pixelDiffCount: 42,
        elements: { runA: null, runB: null },
      });

      const rendered = compareAnswerRenderTransformer({ answer });

      expect(rendered).toBe(
        `INSTANCE: inst_7f3a9c21\nCOMPARING: run_4 -> run_5\nCONSOLE ERRORS: +2\n  Cannot read properties of null\nSERVER ERRORS: +0\nNETWORK NON-2XX: +1\n  POST /api/guilds 500\nPIXEL DELTA: 42 pixels changed\n${NOT_COMPARED}\n`,
      );
    });
  });

  describe('explicit numeric delta fields provided', () => {
    it('VALID: {consoleErrorDelta: 3, serverErrorDelta: -1, networkNon2xxDelta: 0} => formats deltas with signs', () => {
      const answer = CompareAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        runA: RunIdStub({ value: 'run_4' }),
        runB: RunIdStub({ value: 'run_5' }),
        console: { errors: '+2', new: [] },
        network: { errors: '+1', new: [] },
        consoleErrorDelta: 3,
        serverErrorDelta: -1,
        networkNon2xxDelta: 0,
        pixels: null,
        elements: { runA: null, runB: null },
      });

      const rendered = compareAnswerRenderTransformer({ answer });

      expect(rendered).toBe(
        `INSTANCE: inst_7f3a9c21\nCOMPARING: run_4 -> run_5\nCONSOLE ERRORS: +3\nSERVER ERRORS: -1\nNETWORK NON-2XX: +0\nPIXEL DELTA: none\n${NOT_COMPARED}\n`,
      );
    });
  });

  describe('element deltas', () => {
    it('VALID: {runA recorded 22 appeared, runB recorded 2 appeared and 1 changed} => prints no counts, only the not-compared line', () => {
      const answer = CompareAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        runA: RunIdStub({ value: 'run_4' }),
        runB: RunIdStub({ value: 'run_5' }),
        console: { errors: '+0', new: [] },
        network: { errors: '+0', new: [] },
        pixels: null,
        elements: {
          runA: ElementDeltaStub({
            appeared: Array.from({ length: 22 }, (_unused, index) =>
              KeyRowStub({ testId: `E${String(index)}` }),
            ),
            disappeared: [],
            changed: [],
          }),
          runB: ElementDeltaStub({
            appeared: [KeyRowStub({ testId: 'A' }), KeyRowStub({ testId: 'B' })],
            disappeared: [],
            changed: [
              {
                before: KeyRowStub({ testId: 'C', text: 'old' }),
                after: KeyRowStub({ testId: 'C', text: 'new' }),
              },
            ],
          }),
        },
      });

      const rendered = compareAnswerRenderTransformer({ answer });

      expect(rendered).toBe(
        `INSTANCE: inst_7f3a9c21\nCOMPARING: run_4 -> run_5\nCONSOLE ERRORS: +0\nSERVER ERRORS: +0\nNETWORK NON-2XX: +0\nPIXEL DELTA: none\n${NOT_COMPARED}\n`,
      );
    });
  });
});
