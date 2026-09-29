import { AbsoluteFilePathStub, ContentTextStub } from '@dungeonmaster/shared/contracts';

import { BufferEntryStub } from '../../../contracts/buffer-entry/buffer-entry.stub';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { StepIndexStub } from '../../../contracts/step-index/step-index.stub';
import { bufferLatestRunLayerBroker } from './buffer-latest-run-layer-broker';
import { bufferLatestRunLayerBrokerProxy } from './buffer-latest-run-layer-broker.proxy';

const BUFFER_PATH = AbsoluteFilePathStub({
  value: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1/network.jsonl',
});

describe('bufferLatestRunLayerBroker', () => {
  it('VALID: {run_3 lines, then run_5 lines, then an untagged line} => names run_5 and its own line count', async () => {
    const proxy = bufferLatestRunLayerBrokerProxy();
    const entries = [
      BufferEntryStub({ runId: RunIdStub({ value: 'run_3' }), step: StepIndexStub({ value: 1 }) }),
      BufferEntryStub({ runId: RunIdStub({ value: 'run_5' }), step: StepIndexStub({ value: 1 }) }),
      BufferEntryStub({ runId: RunIdStub({ value: 'run_5' }), step: StepIndexStub({ value: 2 }) }),
      BufferEntryStub({ runId: null, step: null, text: ContentTextStub({ value: '{}' }) }),
    ];
    proxy.setupBuffer({
      bufferPath: BUFFER_PATH,
      content: entries.map((entry) => `${JSON.stringify(entry)}\n`).join(''),
    });

    const result = await bufferLatestRunLayerBroker({ bufferPath: BUFFER_PATH });

    expect(result).toStrictEqual({ runId: 'run_5', rows: 2 });
  });

  it('EMPTY: {only untagged lines} => returns null', async () => {
    const proxy = bufferLatestRunLayerBrokerProxy();
    proxy.setupBuffer({
      bufferPath: BUFFER_PATH,
      content: `${JSON.stringify(BufferEntryStub({ runId: null, step: null }))}\n`,
    });

    const result = await bufferLatestRunLayerBroker({ bufferPath: BUFFER_PATH });

    expect(result).toBe(null);
  });

  it('EMPTY: {no buffer file} => returns null', async () => {
    const proxy = bufferLatestRunLayerBrokerProxy();
    proxy.setupMissingBuffer({ bufferPath: BUFFER_PATH });

    const result = await bufferLatestRunLayerBroker({ bufferPath: BUFFER_PATH });

    expect(result).toBe(null);
  });

  it('EDGE: {a truncated final line} => still counts every complete line', async () => {
    const proxy = bufferLatestRunLayerBrokerProxy();
    const entry = BufferEntryStub({ runId: RunIdStub({ value: 'run_2' }) });
    proxy.setupBuffer({
      bufferPath: BUFFER_PATH,
      content: `${JSON.stringify(entry)}\n{"runId":"run_9","st`,
    });

    const result = await bufferLatestRunLayerBroker({ bufferPath: BUFFER_PATH });

    expect(result).toStrictEqual({ runId: 'run_2', rows: 1 });
  });
});
