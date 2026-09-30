import { CleanupCliAnswerStub } from '../../contracts/cleanup-cli-answer/cleanup-cli-answer.stub';
import { cleanupOutcomeClassifyTransformer } from './cleanup-outcome-classify-transformer';

describe('cleanupOutcomeClassifyTransformer', () => {
  describe('nothing touched', () => {
    it('EMPTY: {every field at zero} => classifies empty', () => {
      const answer = CleanupCliAnswerStub();

      const result = cleanupOutcomeClassifyTransformer({ answer });

      expect(result).toBe('empty');
    });
  });

  describe('one reaped entry', () => {
    it('VALID: {reaped: [one entry]} => classifies done', () => {
      const answer = CleanupCliAnswerStub({ reaped: [{ id: 'inst_9b2c' }] });

      const result = cleanupOutcomeClassifyTransformer({ answer });

      expect(result).toBe('done');
    });
  });

  describe('a port released', () => {
    it('VALID: {portsReleased: [one port]} => classifies done', () => {
      const answer = CleanupCliAnswerStub({ portsReleased: [41345] });

      const result = cleanupOutcomeClassifyTransformer({ answer });

      expect(result).toBe('done');
    });
  });

  describe('the lock released', () => {
    it('VALID: {lockReleased: true} => classifies done', () => {
      const answer = CleanupCliAnswerStub({ lockReleased: true });

      const result = cleanupOutcomeClassifyTransformer({ answer });

      expect(result).toBe('done');
    });
  });

  describe('assets aged', () => {
    it('VALID: {assetsAged.instances: 1} => classifies done', () => {
      const answer = CleanupCliAnswerStub({ assetsAged: { instances: 1 } });

      const result = cleanupOutcomeClassifyTransformer({ answer });

      expect(result).toBe('done');
    });
  });

  describe('leftAlone never decides the word', () => {
    it('EMPTY: {leftAlone-carrying answer with every other field at zero} => still classifies empty', () => {
      const answer = CleanupCliAnswerStub();

      const result = cleanupOutcomeClassifyTransformer({ answer });

      expect(result).toBe('empty');
    });
  });
});
