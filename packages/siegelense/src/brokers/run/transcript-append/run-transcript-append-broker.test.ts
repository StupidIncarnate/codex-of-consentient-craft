import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';

import { StepReadingStub } from '../../../contracts/step-reading/step-reading.stub';

import { runTranscriptAppendBroker } from './run-transcript-append-broker';
import { runTranscriptAppendBrokerProxy } from './run-transcript-append-broker.proxy';

describe('runTranscriptAppendBroker', () => {
  describe('a step reading', () => {
    it('VALID: {reading} => appends the reading as one newline-terminated JSON line', async () => {
      const proxy = runTranscriptAppendBrokerProxy();
      const transcriptPath = '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_2.jsonl';
      const reading = StepReadingStub();
      proxy.succeeds({ transcriptPath });

      await expect(runTranscriptAppendBroker({ transcriptPath, reading })).resolves.toBe(undefined);

      expect(proxy.appendedLinesFor({ transcriptPath })).toStrictEqual([
        `${JSON.stringify(reading)}\n`,
      ]);
    });

    it('VALID: {two readings} => each is appended as its own line, in order', async () => {
      const proxy = runTranscriptAppendBrokerProxy();
      const transcriptPath = '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_2.jsonl';
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

  describe('the append rejects', () => {
    it('ERROR: {disk write fails} => the append broker rejects with the same error', async () => {
      const proxy = runTranscriptAppendBrokerProxy();
      const transcriptPath = '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_2.jsonl';
      const error = FsErrorStub({ code: 'ENOSPC', path: String(transcriptPath) });
      proxy.throws({ transcriptPath, error });

      await expect(
        runTranscriptAppendBroker({ transcriptPath, reading: StepReadingStub() }),
      ).rejects.toBe(error);
    });
  });
});
