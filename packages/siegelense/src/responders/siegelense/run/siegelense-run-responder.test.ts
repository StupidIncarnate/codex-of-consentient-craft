import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import { RunResultStub } from '../../../contracts/run-result/run-result.stub';
import { InstanceUnknownError } from '../../../errors/instance-unknown/instance-unknown-error';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { runAnswerRenderTransformer } from '../../../transformers/run-answer-render/run-answer-render-transformer';

import { SiegelenseRunResponder } from './siegelense-run-responder';
import { SiegelenseRunResponderProxy } from './siegelense-run-responder.proxy';

describe('SiegelenseRunResponder', () => {
  describe('a two-step batch against a known instance', () => {
    it('VALID: {--steps with a two-step batch} => writes the concise human summary by default', async () => {
      const proxy = SiegelenseRunResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const registry = RegistryStub({
        instances: [RegistryEntryStub({ id: instanceId, state: 'alive' })],
      });
      const runResult = RunResultStub({ instanceId });
      proxy.stageRegistry({ registry });
      proxy.stageRunResult({ result: runResult });
      const stepsJson = JSON.stringify([
        { step: 'goto', path: '/' },
        { step: 'click', target: '[data-testid="GUILD_ADD"]' },
      ]);

      await SiegelenseRunResponder({
        args: ['--instance', instanceId, '--steps', stepsJson],
      });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        runAnswerRenderTransformer({ result: runResult }),
      ]);
    });
  });

  describe('the written document', () => {
    it('VALID: {--json passed} => writes the complete RunResult as raw JSON', async () => {
      const proxy = SiegelenseRunResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const registry = RegistryStub({
        instances: [RegistryEntryStub({ id: instanceId, state: 'alive' })],
      });
      const runResult = RunResultStub({ instanceId });
      proxy.stageRegistry({ registry });
      proxy.stageRunResult({ result: runResult });

      await SiegelenseRunResponder({
        args: [
          '--instance',
          instanceId,
          '--steps',
          JSON.stringify([{ step: 'goto', path: '/' }]),
          '--json',
        ],
      });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(runResult, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  describe('stopOn never', () => {
    it("VALID: {stopOn 'never'} => the broker was called with 'never'", async () => {
      const proxy = SiegelenseRunResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const registry = RegistryStub({
        instances: [RegistryEntryStub({ id: instanceId, state: 'alive' })],
      });
      const runResult = RunResultStub({ instanceId });
      proxy.stageRegistry({ registry });
      proxy.stageRunResult({ result: runResult });

      await SiegelenseRunResponder({
        args: [
          '--instance',
          instanceId,
          '--steps',
          JSON.stringify([{ step: 'goto', path: '/' }]),
          '--stop-on',
          'never',
        ],
      });

      expect(proxy.getRunCallsMatching()).toStrictEqual([
        [
          {
            instanceId,
            steps: [{ step: 'goto', path: '/', node: null, expect: 'ok' }],
            stopOn: 'never',
          },
        ],
      ]);
    });
  });

  describe('an id the registry never held', () => {
    it('ERROR: {an id the registry never held} => throws InstanceUnknownError and instanceRunBroker is never reached', async () => {
      const proxy = SiegelenseRunResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_deadbeef' });
      const registry = RegistryStub({ instances: [] });
      proxy.stageRegistry({ registry });

      await expect(
        SiegelenseRunResponder({
          args: [
            '--instance',
            instanceId,
            '--steps',
            JSON.stringify([{ step: 'goto', path: '/' }]),
          ],
        }),
      ).rejects.toStrictEqual(new InstanceUnknownError({ instanceId }));
      expect(proxy.getRunCallsMatching()).toStrictEqual([]);
    });
  });

  describe('--steps-file naming a file that does not exist', () => {
    it('ERROR: {--steps-file naming a file that does not exist} => refuses naming the path', async () => {
      const proxy = SiegelenseRunResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const filePath = AbsoluteFilePathStub({
        value: '/tmp/siegelense-run-responder-test/missing-steps.json',
      });
      proxy.stageStepsFileMissing({
        filePath,
        error: new Error(
          "ENOENT: no such file or directory, open '/tmp/siegelense-run-responder-test/missing-steps.json'",
        ),
      });

      await expect(
        SiegelenseRunResponder({
          args: ['--instance', instanceId, '--steps-file', filePath],
        }),
      ).rejects.toThrow(
        /^--steps-file's file could not be read: Failed to read file at \/tmp\/siegelense-run-responder-test\/missing-steps\.json$/u,
      );
    });
  });

  describe('--steps-file naming a real file', () => {
    it('VALID: {--steps-file naming a real file} => its steps reach the broker', async () => {
      const proxy = SiegelenseRunResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const registry = RegistryStub({
        instances: [RegistryEntryStub({ id: instanceId, state: 'alive' })],
      });
      const runResult = RunResultStub({ instanceId });
      proxy.stageRegistry({ registry });
      proxy.stageRunResult({ result: runResult });
      const stepsJson = JSON.stringify([{ step: 'goto', path: '/' }]);
      const filePath = AbsoluteFilePathStub({
        value: '/tmp/siegelense-run-responder-test/steps.json',
      });
      proxy.stageStepsFileContent({ filePath, content: stepsJson });

      await SiegelenseRunResponder({
        args: ['--instance', instanceId, '--steps-file', filePath],
      });

      expect(proxy.getRunCallsMatching()).toStrictEqual([
        [
          {
            instanceId,
            steps: [{ step: 'goto', path: '/', node: null, expect: 'ok' }],
            stopOn: 'error',
          },
        ],
      ]);
    });
  });
});
