import { CompareAnswerStub } from '../../contracts/compare-answer/compare-answer.stub';
import { CountDeltaStub } from '../../contracts/count-delta/count-delta.stub';
import { ElementDeltaStub } from '../../contracts/element-delta/element-delta.stub';
import { InstanceIdStub } from '../../contracts/instance-id/instance-id.stub';
import { KeyRowStub } from '../../contracts/key-row/key-row.stub';
import { RunIdStub } from '../../contracts/run-id/run-id.stub';
import { compareAnswerRenderTransformer } from './compare-answer-render-transformer';

describe('compareAnswerRenderTransformer', () => {
  describe('standard compare answer', () => {
    it('VALID: {runs, deltas, pixels string} => renders concise human view', () => {
      const answer = CompareAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        runA: RunIdStub({ value: 'run_4' }),
        runB: RunIdStub({ value: 'run_5' }),
        console: {
          errors: CountDeltaStub({ value: '+2' }),
          new: [],
        },
        server: {
          errors: CountDeltaStub({ value: '+0' }),
          new: [],
        },
        network: {
          errors: CountDeltaStub({ value: '+1' }),
          new: [],
        },
        pixels: 'last capture differs 12%',
        elements: { runA: null, runB: null },
      });

      const rendered = compareAnswerRenderTransformer({ answer });

      expect(rendered).toBe(
        'INSTANCE: inst_7f3a9c21\nCOMPARING: run_4 -> run_5\nCONSOLE ERRORS: +2\nSERVER ERRORS: +0\nNETWORK NON-2XX: +1\nPIXEL DELTA: last capture differs 12%\nELEMENTS WITHIN RUN A: none\nELEMENTS WITHIN RUN B: none\n',
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
        'INSTANCE: inst_7f3a9c21\nCOMPARING: run_4 -> run_5\nCONSOLE ERRORS: +2\nSERVER ERRORS: +0\nNETWORK NON-2XX: +1\nPIXEL DELTA: none\nELEMENTS WITHIN RUN A: none\nELEMENTS WITHIN RUN B: none\n',
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
        'INSTANCE: inst_7f3a9c21\nCOMPARING: run_4 -> run_5\nCONSOLE ERRORS: +2\nSERVER ERRORS: +0\nNETWORK NON-2XX: +1\nPIXEL DELTA: 42 pixels changed\nELEMENTS WITHIN RUN A: none\nELEMENTS WITHIN RUN B: none\n',
      );
    });
  });

  describe('explicit numeric delta fields provided', () => {
    it('VALID: {consoleErrorDelta: 3, serverErrorDelta: -1, networkNon2xxDelta: 0} => formats deltas with signs', () => {
      const answer = CompareAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        runA: RunIdStub({ value: 'run_4' }),
        runB: RunIdStub({ value: 'run_5' }),
        consoleErrorDelta: 3,
        serverErrorDelta: -1,
        networkNon2xxDelta: 0,
        pixels: null,
        elements: { runA: null, runB: null },
      });

      const rendered = compareAnswerRenderTransformer({ answer });

      expect(rendered).toBe(
        'INSTANCE: inst_7f3a9c21\nCOMPARING: run_4 -> run_5\nCONSOLE ERRORS: +3\nSERVER ERRORS: -1\nNETWORK NON-2XX: +0\nPIXEL DELTA: none\nELEMENTS WITHIN RUN A: none\nELEMENTS WITHIN RUN B: none\n',
      );
    });
  });

  describe('element deltas', () => {
    it('VALID: {runA recorded none, runB recorded 2 appeared and 1 changed} => renders the real counts on each side', () => {
      const answer = CompareAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        runA: RunIdStub({ value: 'run_4' }),
        runB: RunIdStub({ value: 'run_5' }),
        pixels: null,
        elements: {
          runA: null,
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
        'INSTANCE: inst_7f3a9c21\nCOMPARING: run_4 -> run_5\nCONSOLE ERRORS: +2\nSERVER ERRORS: +0\nNETWORK NON-2XX: +1\nPIXEL DELTA: none\nELEMENTS WITHIN RUN A: none\nELEMENTS WITHIN RUN B: +2 -0 ~1\n',
      );
    });

    it('VALID: {runA recorded 22 appeared, runB recorded none} => labels both lines WITHIN its own run, never as a diff against the other run', () => {
      const answer = CompareAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        runA: RunIdStub({ value: 'run_1' }),
        runB: RunIdStub({ value: 'run_2' }),
        pixels: null,
        elements: {
          runA: ElementDeltaStub({
            appeared: Array.from({ length: 22 }, (_unused, index) =>
              KeyRowStub({ testId: `E${String(index)}` }),
            ),
            disappeared: [],
            changed: [],
          }),
          runB: null,
        },
      });

      const rendered = compareAnswerRenderTransformer({ answer });

      expect(rendered).toBe(
        'INSTANCE: inst_7f3a9c21\nCOMPARING: run_1 -> run_2\nCONSOLE ERRORS: +2\nSERVER ERRORS: +0\nNETWORK NON-2XX: +1\nPIXEL DELTA: none\nELEMENTS WITHIN RUN A: +22 -0 ~0\nELEMENTS WITHIN RUN B: none\n',
      );
    });
  });
});
