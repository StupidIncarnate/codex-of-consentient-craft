import { CapacityAnswerStub } from '../../../contracts/capacity-answer/capacity-answer.stub';
import { CapacityMeasuredStub } from '../../../contracts/capacity-measured/capacity-measured.stub';
import { CapacityProfileStub } from '../../../contracts/capacity-profile/capacity-profile.stub';
import { ProfilePoolSizeStub } from '../../../contracts/profile-pool-size/profile-pool-size.stub';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { capacityAnswerRenderTransformer } from '../../../transformers/capacity-answer-render/capacity-answer-render-transformer';

import { SiegelenseCapacityResponder } from './siegelense-capacity-responder';
import { SiegelenseCapacityResponderProxy } from './siegelense-capacity-responder.proxy';

describe('SiegelenseCapacityResponder', () => {
  describe('the default human summary form', () => {
    it('EMPTY: {specName: null, poolSize: null} => writes the CapacityAnswer as human summary by default', async () => {
      const proxy = SiegelenseCapacityResponderProxy();
      const answer = CapacityAnswerStub({
        suggested: 2,
        ceiling: 3,
        why:
          'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 5320MB less 512MB headroom; 1 siege instance already up',
        measured: CapacityMeasuredStub(),
        profile: CapacityProfileStub(),
      });
      proxy.stageAnswer({ specName: null, poolSize: null, answer });

      const result = await SiegelenseCapacityResponder({ specName: null, poolSize: null });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getStdoutWrites()).toStrictEqual([capacityAnswerRenderTransformer({ answer })]);
    });

    it('VALID: {human: true} => writes the CapacityAnswer as human summary when human is explicitly true', async () => {
      const proxy = SiegelenseCapacityResponderProxy();
      const answer = CapacityAnswerStub({
        suggested: 2,
        ceiling: 3,
        why:
          'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 5320MB less 512MB headroom; 1 siege instance already up',
        measured: CapacityMeasuredStub(),
        profile: CapacityProfileStub(),
      });
      proxy.stageAnswer({ specName: null, poolSize: null, answer });

      const result = await SiegelenseCapacityResponder({
        specName: null,
        poolSize: null,
        human: true,
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getStdoutWrites()).toStrictEqual([capacityAnswerRenderTransformer({ answer })]);
    });
  });

  describe('the JSON form', () => {
    it('VALID: {isJson: true} => writes the CapacityAnswer as one JSON document', async () => {
      const proxy = SiegelenseCapacityResponderProxy();
      const answer = CapacityAnswerStub({
        suggested: 2,
        ceiling: 3,
        why:
          'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 5320MB less 512MB headroom; 1 siege instance already up',
        measured: CapacityMeasuredStub(),
        profile: CapacityProfileStub(),
      });
      proxy.stageAnswer({ specName: null, poolSize: null, answer });

      const result = await SiegelenseCapacityResponder({
        specName: null,
        poolSize: null,
        isJson: true,
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });

    it('VALID: {human: false} => writes the CapacityAnswer as JSON when human is explicitly false', async () => {
      const proxy = SiegelenseCapacityResponderProxy();
      const answer = CapacityAnswerStub({
        suggested: 2,
        ceiling: 3,
        why:
          'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 5320MB less 512MB headroom; 1 siege instance already up',
        measured: CapacityMeasuredStub(),
        profile: CapacityProfileStub(),
      });
      proxy.stageAnswer({ specName: null, poolSize: null, answer });

      const result = await SiegelenseCapacityResponder({
        specName: null,
        poolSize: null,
        human: false,
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  describe('both flags named', () => {
    it('VALID: {specName, poolSize: 3} => passes both through to the broker and writes human summary', async () => {
      const proxy = SiegelenseCapacityResponderProxy();
      const specName = SpecNameStub({ value: 'dungeonmaster-api' });
      const poolSize = ProfilePoolSizeStub({ value: 3 });
      const answer = CapacityAnswerStub({
        suggested: 1,
        ceiling: 3,
        why:
          'profile 2810MB peak / 1920MB steady at pool size 3, from 5 runs; ' +
          'free RAM 5000MB less 512MB headroom; nothing else up',
        profile: CapacityProfileStub({
          spec: 'dungeonmaster-api',
          poolSize: 3,
          steadyMB: 1920,
          peakMB: 2810,
          fromRuns: 5,
        }),
      });
      proxy.stageAnswer({ specName, poolSize, answer });

      const result = await SiegelenseCapacityResponder({ specName, poolSize });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getStdoutWrites()).toStrictEqual([capacityAnswerRenderTransformer({ answer })]);
    });
  });

  describe('a spec nothing has ever run', () => {
    it('EMPTY: {profile: null} => writes the default-pair answer in human summary', async () => {
      const proxy = SiegelenseCapacityResponderProxy();
      const answer = CapacityAnswerStub({
        suggested: 2,
        profile: null,
        why:
          'no measured profile for dungeonmaster-stack, so the default pair of 2 profiles itself; ' +
          'free RAM 5320MB less 512MB headroom; nothing else up',
      });
      proxy.stageAnswer({ specName: null, poolSize: null, answer });

      await SiegelenseCapacityResponder({ specName: null, poolSize: null });

      expect(proxy.getStdoutWrites()).toStrictEqual([capacityAnswerRenderTransformer({ answer })]);
    });
  });
});
