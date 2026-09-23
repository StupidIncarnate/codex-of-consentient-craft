import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { runMissingCheckLayerBroker } from './run-missing-check-layer-broker';
import { runMissingCheckLayerBrokerProxy } from './run-missing-check-layer-broker.proxy';

const INSTANCE_ID = InstanceIdStub();
const RUN_ID = RunIdStub({ value: 'run_999' });
const STORED_RETURN_PATH = AbsoluteFilePathStub({
  value:
    '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_7f3a9c21/runs/run_999.json',
});
const TRANSCRIPT_PATH = AbsoluteFilePathStub({
  value:
    '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_7f3a9c21/runs/run_999.jsonl',
});

describe('runMissingCheckLayerBroker', () => {
  it('VALID: {stored return present} => returns its content without reading the transcript', async () => {
    const proxy = runMissingCheckLayerBrokerProxy();
    proxy.setupStoredReturn({ storedReturnPath: STORED_RETURN_PATH, content: '{"shots":[]}' });

    const result = await runMissingCheckLayerBroker({
      instanceId: INSTANCE_ID,
      runId: RUN_ID,
      storedReturnPath: STORED_RETURN_PATH,
      transcriptPath: TRANSCRIPT_PATH,
    });

    expect(result).toStrictEqual({ storedReturnContent: '{"shots":[]}' });
  });

  it('EDGE: {stored return absent, transcript present} => still reaches the run: returns null rather than throwing', async () => {
    const proxy = runMissingCheckLayerBrokerProxy();
    proxy.setupMissingStoredReturn({ storedReturnPath: STORED_RETURN_PATH });
    proxy.setupTranscript({ transcriptPath: TRANSCRIPT_PATH, content: '{"step":1}\n' });

    const result = await runMissingCheckLayerBroker({
      instanceId: INSTANCE_ID,
      runId: RUN_ID,
      storedReturnPath: STORED_RETURN_PATH,
      transcriptPath: TRANSCRIPT_PATH,
    });

    expect(result).toStrictEqual({ storedReturnContent: null });
  });

  it('ERROR: {stored return absent, transcript absent} => throws RunMissingError naming the run', async () => {
    const proxy = runMissingCheckLayerBrokerProxy();
    proxy.setupMissingStoredReturn({ storedReturnPath: STORED_RETURN_PATH });
    proxy.setupMissingTranscript({ transcriptPath: TRANSCRIPT_PATH });

    await expect(
      runMissingCheckLayerBroker({
        instanceId: INSTANCE_ID,
        runId: RUN_ID,
        storedReturnPath: STORED_RETURN_PATH,
        transcriptPath: TRANSCRIPT_PATH,
      }),
    ).rejects.toThrow(
      /^No stored return for run "run_999" on instance "inst_7f3a9c21" — that run never completed, or its evidence was pruned\.$/u,
    );
  });
});
