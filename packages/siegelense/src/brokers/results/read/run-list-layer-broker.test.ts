import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { runListLayerBroker } from './run-list-layer-broker';
import { runListLayerBrokerProxy } from './run-list-layer-broker.proxy';

const EVIDENCE_PATH = AbsoluteFilePathStub({
  value: '/repo/.siegelense/unowned/instances/inst_1',
});

describe('runListLayerBroker', () => {
  it('EMPTY: {no runs directory} => runCount 0, latestRunId null', async () => {
    const proxy = runListLayerBrokerProxy();
    proxy.setupRunsDirMissing({ evidencePath: EVIDENCE_PATH });

    const result = await runListLayerBroker({ evidencePath: EVIDENCE_PATH });

    expect(result).toStrictEqual({ runCount: 0, latestRunId: null });
  });

  it('VALID: {run_1.json, run_1.jsonl, a run_1 shots dir} => runCount 1, latestRunId run_1', async () => {
    const proxy = runListLayerBrokerProxy();
    proxy.setupRuns({
      evidencePath: EVIDENCE_PATH,
      entries: ['run_1.json', 'run_1.jsonl', 'run_1'],
    });

    const result = await runListLayerBroker({ evidencePath: EVIDENCE_PATH });

    expect(result).toStrictEqual({ runCount: 1, latestRunId: 'run_1' });
  });

  it('VALID: {run_1.json, run_2.json, run_10.json} => runCount 3, latestRunId run_10 by NUMBER not string order', async () => {
    const proxy = runListLayerBrokerProxy();
    proxy.setupRuns({
      evidencePath: EVIDENCE_PATH,
      entries: ['run_1.json', 'run_2.json', 'run_10.json'],
    });

    const result = await runListLayerBroker({ evidencePath: EVIDENCE_PATH });

    expect(result).toStrictEqual({ runCount: 3, latestRunId: 'run_10' });
  });
});
