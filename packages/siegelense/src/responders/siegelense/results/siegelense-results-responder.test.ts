import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import { ResultsAnswerStub } from '../../../contracts/results-answer/results-answer.stub';
import { ResultsQueryStub } from '../../../contracts/results-query/results-query.stub';
import { InstanceUnknownError } from '../../../errors/instance-unknown/instance-unknown-error';
import { RunIdRequiredError } from '../../../errors/run-id-required/run-id-required-error';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { resultsAnswerRenderTransformer } from '../../../transformers/results-answer-render/results-answer-render-transformer';

import { SiegelenseResultsResponder } from './siegelense-results-responder';
import { SiegelenseResultsResponderProxy } from './siegelense-results-responder.proxy';

describe('SiegelenseResultsResponder', () => {
  describe('a run named', () => {
    it('VALID: {a run named} => writes the concise human view by default', async () => {
      const proxy = SiegelenseResultsResponderProxy();
      const query = ResultsQueryStub({ runId: RunIdStub({ value: 'run_2' }) });
      const answer = ResultsAnswerStub({ instanceId: query.instanceId, runId: query.runId });
      proxy.stageRegistry({
        registry: RegistryStub({ instances: [RegistryEntryStub({ id: query.instanceId })] }),
      });
      proxy.stageAnswer({ answer });

      await SiegelenseResultsResponder({ query });

      expect(proxy.getStdoutWrites()).toStrictEqual([resultsAnswerRenderTransformer({ answer })]);
    });

    it('VALID: {isJson: true} => writes the complete ResultsAnswer as raw JSON', async () => {
      const proxy = SiegelenseResultsResponderProxy();
      const query = ResultsQueryStub({ runId: RunIdStub({ value: 'run_2' }) });
      const answer = ResultsAnswerStub({ instanceId: query.instanceId, runId: query.runId });
      proxy.stageRegistry({
        registry: RegistryStub({ instances: [RegistryEntryStub({ id: query.instanceId })] }),
      });
      proxy.stageAnswer({ answer });

      await SiegelenseResultsResponder({ query, isJson: true });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  describe('an unknown instance id', () => {
    it('ERROR: {an unknown instance id} => throws InstanceUnknownError and resultsReadBroker is never reached', async () => {
      const proxy = SiegelenseResultsResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_deadbeef' });
      const query = ResultsQueryStub({ instanceId });
      proxy.stageRegistry({ registry: RegistryStub({ instances: [] }) });

      await expect(SiegelenseResultsResponder({ query })).rejects.toStrictEqual(
        new InstanceUnknownError({ instanceId }),
      );
      expect(proxy.getStdoutWrites()).toStrictEqual([]);
    });
  });

  describe('a finished instance with no run and no since', () => {
    it('ERROR: {a finished instance with no run and no since} => RunIdRequiredError propagates and stdout stays empty', async () => {
      const proxy = SiegelenseResultsResponderProxy();
      const query = ResultsQueryStub();
      proxy.stageRegistry({
        registry: RegistryStub({ instances: [RegistryEntryStub({ id: query.instanceId })] }),
      });
      const error = new RunIdRequiredError({
        instanceId: 'inst_7f3a9c21',
        instanceState: 'killed',
        runCount: 2,
      });
      proxy.stageError({ error });

      await expect(SiegelenseResultsResponder({ query })).rejects.toStrictEqual(error);
      expect(proxy.getStdoutWrites()).toStrictEqual([]);
    });
  });
});
