import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { runListLayerBroker } from './run-list-layer-broker';
import { runListLayerBrokerProxy } from './run-list-layer-broker.proxy';

const EVIDENCE_PATH = AbsoluteFilePathStub({
  value: '/repo/.siegelense/unowned/instances/inst_1',
});

describe('runListLayerBroker', () => {
  it('EMPTY: {no runs directory} => runCount 0, latestRunId null, evidenceComplete true', async () => {
    const proxy = runListLayerBrokerProxy();
    proxy.setupRunsDirMissing({ evidencePath: EVIDENCE_PATH });

    const result = await runListLayerBroker({ evidencePath: EVIDENCE_PATH });

    expect(result).toStrictEqual({ runCount: 0, latestRunId: null, evidenceComplete: true });
  });

  it('VALID: {run_1.json, run_1.jsonl, a run_1 shots dir} => runCount 1, latestRunId run_1, evidenceComplete true', async () => {
    const proxy = runListLayerBrokerProxy();
    proxy.setupRuns({
      evidencePath: EVIDENCE_PATH,
      entries: ['run_1.json', 'run_1.jsonl', 'run_1'],
    });

    const result = await runListLayerBroker({ evidencePath: EVIDENCE_PATH });

    expect(result).toStrictEqual({ runCount: 1, latestRunId: 'run_1', evidenceComplete: true });
  });

  it('VALID: {run_1, run_2, run_10, all complete} => runCount 3, latestRunId run_10 by NUMBER not string order', async () => {
    const proxy = runListLayerBrokerProxy();
    proxy.setupRuns({
      evidencePath: EVIDENCE_PATH,
      entries: [
        'run_1.jsonl',
        'run_1.json',
        'run_2.jsonl',
        'run_2.json',
        'run_10.jsonl',
        'run_10.json',
      ],
    });

    const result = await runListLayerBroker({ evidencePath: EVIDENCE_PATH });

    expect(result).toStrictEqual({ runCount: 3, latestRunId: 'run_10', evidenceComplete: true });
  });

  it('EDGE: {run_1 complete, run_2.jsonl only — the crashed-run shape} => runCount 2, latestRunId run_2, evidenceComplete false', async () => {
    const proxy = runListLayerBrokerProxy();
    proxy.setupRuns({
      evidencePath: EVIDENCE_PATH,
      entries: ['run_1.jsonl', 'run_1.json', 'run_2.jsonl'],
    });

    const result = await runListLayerBroker({ evidencePath: EVIDENCE_PATH });

    expect(result).toStrictEqual({ runCount: 2, latestRunId: 'run_2', evidenceComplete: false });
  });
});
