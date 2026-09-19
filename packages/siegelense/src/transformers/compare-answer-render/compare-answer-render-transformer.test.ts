import { CompareAnswerStub } from '../../contracts/compare-answer/compare-answer.stub';
import { CountDeltaStub } from '../../contracts/count-delta/count-delta.stub';
import { InstanceIdStub } from '../../contracts/instance-id/instance-id.stub';
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
      });

      const rendered = compareAnswerRenderTransformer({ answer });

      expect(rendered).toBe(
        'INSTANCE: inst_7f3a9c21\nCOMPARING: run_4 -> run_5\nCONSOLE ERRORS: +2\nSERVER ERRORS: +0\nNETWORK NON-2XX: +1\nPIXEL DELTA: last capture differs 12%\n',
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
      });

      const rendered = compareAnswerRenderTransformer({ answer });

      expect(rendered).toBe(
        'INSTANCE: inst_7f3a9c21\nCOMPARING: run_4 -> run_5\nCONSOLE ERRORS: +2\nSERVER ERRORS: +0\nNETWORK NON-2XX: +1\nPIXEL DELTA: none\n',
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
      });

      const rendered = compareAnswerRenderTransformer({ answer });

      expect(rendered).toBe(
        'INSTANCE: inst_7f3a9c21\nCOMPARING: run_4 -> run_5\nCONSOLE ERRORS: +2\nSERVER ERRORS: +0\nNETWORK NON-2XX: +1\nPIXEL DELTA: 42 pixels changed\n',
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
      });

      const rendered = compareAnswerRenderTransformer({ answer });

      expect(rendered).toBe(
        'INSTANCE: inst_7f3a9c21\nCOMPARING: run_4 -> run_5\nCONSOLE ERRORS: +3\nSERVER ERRORS: -1\nNETWORK NON-2XX: +0\nPIXEL DELTA: none\n',
      );
    });
  });
});
