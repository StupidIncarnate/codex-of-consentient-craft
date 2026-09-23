import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { StepReadingStub } from '../../../contracts/step-reading/step-reading.stub';
import { StepIndexStub } from '../../../contracts/step-index/step-index.stub';
import { transcriptReadLayerBroker } from './transcript-read-layer-broker';
import { transcriptReadLayerBrokerProxy } from './transcript-read-layer-broker.proxy';

const TRANSCRIPT_PATH = AbsoluteFilePathStub({
  value: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1/runs/run_2.jsonl',
});

describe('transcriptReadLayerBroker', () => {
  it('EMPTY: {no transcript file} => returns an empty array', async () => {
    const proxy = transcriptReadLayerBrokerProxy();
    proxy.setupMissingTranscript({ transcriptPath: TRANSCRIPT_PATH });

    const result = await transcriptReadLayerBroker({ transcriptPath: TRANSCRIPT_PATH });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {two complete lines} => parses both readings, in file order', async () => {
    const proxy = transcriptReadLayerBrokerProxy();
    const first = StepReadingStub({ step: StepIndexStub({ value: 1 }) });
    const second = StepReadingStub({ step: StepIndexStub({ value: 2 }) });
    proxy.setupTranscript({
      transcriptPath: TRANSCRIPT_PATH,
      content: `${JSON.stringify(first)}\n${JSON.stringify(second)}\n`,
    });

    const result = await transcriptReadLayerBroker({ transcriptPath: TRANSCRIPT_PATH });

    expect(result).toStrictEqual([first, second]);
  });

  it('EDGE: {a transcript whose last line is truncated} => the earlier readings still answer', async () => {
    const proxy = transcriptReadLayerBrokerProxy();
    const first = StepReadingStub({ step: StepIndexStub({ value: 1 }) });
    const second = StepReadingStub({ step: StepIndexStub({ value: 2 }) });
    const truncatedTail = JSON.stringify(second).slice(0, 20);
    proxy.setupTranscript({
      transcriptPath: TRANSCRIPT_PATH,
      content: `${JSON.stringify(first)}\n${truncatedTail}`,
    });

    const result = await transcriptReadLayerBroker({ transcriptPath: TRANSCRIPT_PATH });

    expect(result).toStrictEqual([first]);
  });
});
