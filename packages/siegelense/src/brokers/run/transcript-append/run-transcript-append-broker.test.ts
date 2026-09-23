import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { StepReadingStub } from '../../../contracts/step-reading/step-reading.stub';

import { runTranscriptAppendBroker } from './run-transcript-append-broker';
import { runTranscriptAppendBrokerProxy } from './run-transcript-append-broker.proxy';

describe('runTranscriptAppendBroker', () => {
  describe('a step reading', () => {
    it('VALID: {reading} => appends one JSON line and returns success', async () => {
      const proxy = runTranscriptAppendBrokerProxy();
      const transcriptPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_2.jsonl',
      });
      const reading = StepReadingStub();
      proxy.succeeds({ transcriptPath });

      const result = await runTranscriptAppendBroker({ transcriptPath, reading });

      expect(result).toStrictEqual({ success: true });
    });

    it('VALID: {two readings} => each is appended as its own line, in order', async () => {
      const proxy = runTranscriptAppendBrokerProxy();
      const transcriptPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_2.jsonl',
      });
      const firstReading = StepReadingStub({});
      const secondReading = StepReadingStub({});
      proxy.succeeds({ transcriptPath });

      await runTranscriptAppendBroker({ transcriptPath, reading: firstReading });
      await runTranscriptAppendBroker({ transcriptPath, reading: secondReading });

      expect(proxy.appendedLinesFor({ transcriptPath })).toStrictEqual([
        `${JSON.stringify(firstReading)}\n`,
        `${JSON.stringify(secondReading)}\n`,
      ]);
    });
  });

  describe('the adapter rejects', () => {
    it('ERROR: {disk write fails} => the append broker rejects with the same error', async () => {
      const proxy = runTranscriptAppendBrokerProxy();
      const transcriptPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_2.jsonl',
      });
      proxy.throws({ transcriptPath, error: new Error('ENOSPC') });

      const error = await runTranscriptAppendBroker({
        transcriptPath,
        reading: StepReadingStub(),
      }).then(
        (): never => {
          throw new Error('Expected runTranscriptAppendBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect(error.message).toBe('ENOSPC');
    });
  });
});
