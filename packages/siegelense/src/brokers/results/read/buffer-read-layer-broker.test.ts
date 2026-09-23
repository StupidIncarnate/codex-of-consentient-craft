import { AbsoluteFilePathStub, ContentTextStub } from '@dungeonmaster/shared/contracts';

import { BufferEntryStub } from '../../../contracts/buffer-entry/buffer-entry.stub';
import { ResultWhereStub } from '../../../contracts/result-where/result-where.stub';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { StepIndexStub } from '../../../contracts/step-index/step-index.stub';
import { bufferReadLayerBroker } from './buffer-read-layer-broker';
import { bufferReadLayerBrokerProxy } from './buffer-read-layer-broker.proxy';

const BUFFER_PATH = AbsoluteFilePathStub({
  value: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1/network.jsonl',
});
const RUN_2 = RunIdStub({ value: 'run_2' });

const networkText = ({
  method,
  url,
  status,
}: {
  method: string;
  url: string;
  status: number;
}): ReturnType<typeof ContentTextStub> =>
  ContentTextStub({
    value: JSON.stringify({
      at: 1,
      method,
      url,
      resourceType: 'fetch',
      status,
      requestBody: null,
      responseBody: 'ok',
    }),
  });

describe('bufferReadLayerBroker', () => {
  it('EMPTY: {no buffer file} => returns an empty array', async () => {
    const proxy = bufferReadLayerBrokerProxy();
    proxy.setupMissingBuffer({ bufferPath: BUFFER_PATH });

    const result = await bufferReadLayerBroker({
      bufferPath: BUFFER_PATH,
      runId: RUN_2,
      sinceBoot: false,
      step: null,
      where: null,
    });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {step: 7} => only the entries tagged with step 7, from a fixture holding steps 6, 7 and 8', async () => {
    const proxy = bufferReadLayerBrokerProxy();
    const step6 = BufferEntryStub({
      runId: RUN_2,
      step: StepIndexStub({ value: 6 }),
      text: networkText({ method: 'GET', url: '/api/a', status: 200 }),
    });
    const step7 = BufferEntryStub({
      runId: RUN_2,
      step: StepIndexStub({ value: 7 }),
      text: networkText({ method: 'GET', url: '/api/b', status: 200 }),
    });
    const step8 = BufferEntryStub({
      runId: RUN_2,
      step: StepIndexStub({ value: 8 }),
      text: networkText({ method: 'GET', url: '/api/c', status: 200 }),
    });
    proxy.setupBuffer({
      bufferPath: BUFFER_PATH,
      content: [step6, step7, step8].map((entry) => `${JSON.stringify(entry)}\n`).join(''),
    });

    const result = await bufferReadLayerBroker({
      bufferPath: BUFFER_PATH,
      runId: RUN_2,
      sinceBoot: false,
      step: StepIndexStub({ value: 7 }),
      where: null,
    });

    expect(result).toStrictEqual([step7.text]);
  });

  it('VALID: {where: {path, method}} => only the matching exchange', async () => {
    const proxy = bufferReadLayerBrokerProxy();
    const matching = BufferEntryStub({
      runId: RUN_2,
      step: StepIndexStub({ value: 4 }),
      text: networkText({ method: 'POST', url: '/api/quests', status: 201 }),
    });
    const otherPath = BufferEntryStub({
      runId: RUN_2,
      step: StepIndexStub({ value: 4 }),
      text: networkText({ method: 'POST', url: '/api/guilds', status: 201 }),
    });
    const otherMethod = BufferEntryStub({
      runId: RUN_2,
      step: StepIndexStub({ value: 4 }),
      text: networkText({ method: 'GET', url: '/api/quests', status: 200 }),
    });
    proxy.setupBuffer({
      bufferPath: BUFFER_PATH,
      content: [matching, otherPath, otherMethod]
        .map((entry) => `${JSON.stringify(entry)}\n`)
        .join(''),
    });

    const result = await bufferReadLayerBroker({
      bufferPath: BUFFER_PATH,
      runId: RUN_2,
      sinceBoot: false,
      step: null,
      where: ResultWhereStub({ path: '/api/quests', method: 'POST' }),
    });

    expect(result).toStrictEqual([matching.text]);
  });

  it('VALID: {sinceBoot: true} => entries from run_1 AND run_2 AND the untagged between-runs entry', async () => {
    const proxy = bufferReadLayerBrokerProxy();
    const run1Entry = BufferEntryStub({ runId: RunIdStub({ value: 'run_1' }), step: null });
    const betweenRunsEntry = BufferEntryStub({ runId: null, step: null });
    const run2Entry = BufferEntryStub({ runId: RUN_2, step: null });
    proxy.setupBuffer({
      bufferPath: BUFFER_PATH,
      content: [run1Entry, betweenRunsEntry, run2Entry]
        .map((entry) => `${JSON.stringify(entry)}\n`)
        .join(''),
    });

    const result = await bufferReadLayerBroker({
      bufferPath: BUFFER_PATH,
      runId: null,
      sinceBoot: true,
      step: null,
      where: null,
    });

    expect(result).toStrictEqual([run1Entry.text, betweenRunsEntry.text, run2Entry.text]);
  });

  it('VALID: {where: {level: error}} => only entries matching resultsStatics.patterns.consoleError', async () => {
    const proxy = bufferReadLayerBrokerProxy();
    const errorEntry = BufferEntryStub({
      runId: RUN_2,
      text: ContentTextStub({
        value: JSON.stringify({
          at: 1,
          kind: 'console',
          type: 'error',
          text: 'x',
          url: '',
          line: 0,
        }),
      }),
    });
    const logEntry = BufferEntryStub({
      runId: RUN_2,
      text: ContentTextStub({
        value: JSON.stringify({ at: 1, kind: 'console', type: 'log', text: 'x', url: '', line: 0 }),
      }),
    });
    proxy.setupBuffer({
      bufferPath: BUFFER_PATH,
      content: [errorEntry, logEntry].map((entry) => `${JSON.stringify(entry)}\n`).join(''),
    });

    const result = await bufferReadLayerBroker({
      bufferPath: BUFFER_PATH,
      runId: RUN_2,
      sinceBoot: false,
      step: null,
      where: ResultWhereStub({ level: 'error' }),
    });

    expect(result).toStrictEqual([errorEntry.text]);
  });

  it('EDGE: {a transcript-style truncated final line} => the earlier complete entries still answer', async () => {
    const proxy = bufferReadLayerBrokerProxy();
    const complete = BufferEntryStub({ runId: RUN_2 });
    const truncatedTail = JSON.stringify(BufferEntryStub({ runId: RUN_2 })).slice(0, 10);
    proxy.setupBuffer({
      bufferPath: BUFFER_PATH,
      content: `${JSON.stringify(complete)}\n${truncatedTail}`,
    });

    const result = await bufferReadLayerBroker({
      bufferPath: BUFFER_PATH,
      runId: RUN_2,
      sinceBoot: false,
      step: null,
      where: null,
    });

    expect(result).toStrictEqual([complete.text]);
  });
});
