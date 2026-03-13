import { DependencyStepStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { resolveCodeweaverLayerBroker } from './resolve-codeweaver-layer-broker';
import { resolveCodeweaverLayerBrokerProxy } from './resolve-codeweaver-layer-broker.proxy';

describe('resolveCodeweaverLayerBroker', () => {
  describe('active steps present', () => {
    it('VALID: {steps: [pending]} => launch-codeweaver', () => {
      resolveCodeweaverLayerBrokerProxy();
      const quest = QuestStub({
        steps: [DependencyStepStub({ status: 'pending' })],
      });

      const result = resolveCodeweaverLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver' });
    });

    it('VALID: {steps: [in_progress]} => launch-codeweaver', () => {
      resolveCodeweaverLayerBrokerProxy();
      const quest = QuestStub({
        steps: [DependencyStepStub({ status: 'in_progress' })],
      });

      const result = resolveCodeweaverLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver' });
    });

    it('VALID: {steps: [partially_complete]} => launch-codeweaver', () => {
      resolveCodeweaverLayerBrokerProxy();
      const quest = QuestStub({
        steps: [DependencyStepStub({ status: 'partially_complete' })],
      });

      const result = resolveCodeweaverLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver' });
    });

    it('VALID: {steps: [blocked]} => launch-codeweaver', () => {
      resolveCodeweaverLayerBrokerProxy();
      const quest = QuestStub({
        steps: [DependencyStepStub({ status: 'blocked' })],
      });

      const result = resolveCodeweaverLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver' });
    });
  });

  describe('no active steps', () => {
    it('VALID: {steps: [complete]} => undefined', () => {
      resolveCodeweaverLayerBrokerProxy();
      const quest = QuestStub({
        steps: [DependencyStepStub({ status: 'complete' })],
      });

      const result = resolveCodeweaverLayerBroker({ quest });

      expect(result).toBeUndefined();
    });

    it('VALID: {steps: [failed]} => undefined (failed is terminal)', () => {
      resolveCodeweaverLayerBrokerProxy();
      const quest = QuestStub({
        steps: [DependencyStepStub({ status: 'failed' })],
      });

      const result = resolveCodeweaverLayerBroker({ quest });

      expect(result).toBeUndefined();
    });

    it('EMPTY: {steps: []} => undefined', () => {
      resolveCodeweaverLayerBrokerProxy();
      const quest = QuestStub({ steps: [] });

      const result = resolveCodeweaverLayerBroker({ quest });

      expect(result).toBeUndefined();
    });
  });
});
