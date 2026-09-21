import { CleanupAnswerStub } from '../../contracts/cleanup-answer/cleanup-answer.stub';
import { cleanupOutcomeClassifyTransformer } from './cleanup-outcome-classify-transformer';

describe('cleanupOutcomeClassifyTransformer', () => {
  describe('nothing touched', () => {
    it('EMPTY: {every field at zero} => classifies empty', () => {
      const answer = CleanupAnswerStub();

      const result = cleanupOutcomeClassifyTransformer({ answer });

      expect(result).toBe('empty');
    });
  });

  describe('one reaped entry', () => {
    it('VALID: {reaped: [one entry]} => classifies done', () => {
      const answer = CleanupAnswerStub({ reaped: [{ id: 'inst_9b2c' }] });

      const result = cleanupOutcomeClassifyTransformer({ answer });

      expect(result).toBe('done');
    });
  });

  describe('a port released', () => {
    it('VALID: {portsReleased: [one port]} => classifies done', () => {
      const answer = CleanupAnswerStub({ portsReleased: [41345] });

      const result = cleanupOutcomeClassifyTransformer({ answer });

      expect(result).toBe('done');
    });
  });

  describe('the lock released', () => {
    it('VALID: {lockReleased: true} => classifies done', () => {
      const answer = CleanupAnswerStub({ lockReleased: true });

      const result = cleanupOutcomeClassifyTransformer({ answer });

      expect(result).toBe('done');
    });
  });

  describe('assets aged', () => {
    it('VALID: {assetsAged.instances: 1} => classifies done', () => {
      const answer = CleanupAnswerStub({ assetsAged: { instances: 1 } });

      const result = cleanupOutcomeClassifyTransformer({ answer });

      expect(result).toBe('done');
    });
  });

  describe('leftAlone never decides the word', () => {
    it('EMPTY: {leftAlone-carrying answer with every other field at zero} => still classifies empty', () => {
      const answer = CleanupAnswerStub();

      const result = cleanupOutcomeClassifyTransformer({ answer });

      expect(result).toBe('empty');
    });
  });
});
