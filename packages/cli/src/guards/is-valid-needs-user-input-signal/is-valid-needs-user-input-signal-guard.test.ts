/**
 * Tests for isValidNeedsUserInputSignalGuard
 */

import { isValidNeedsUserInputSignalGuard } from './is-valid-needs-user-input-signal-guard';
import { StreamSignalStub } from '../../contracts/stream-signal/stream-signal.stub';

type StreamSignal = ReturnType<typeof StreamSignalStub>;

// Helper stubs for signals with specific configurations
// The StreamSignalStub defaults to 'complete' with summary, so we need to create
// variants for needs-user-input testing
const NeedsUserInputSignalWithQuestionAndContextStub = (): StreamSignal =>
  StreamSignalStub({
    signal: 'needs-user-input',
    question: 'What is your preference?' as StreamSignal['question'],
    context: 'We need to know which option to use.' as StreamSignal['context'],
  });

const NeedsUserInputSignalWithContextOnlyStub = (): StreamSignal =>
  StreamSignalStub({
    signal: 'needs-user-input',
    context: 'We need to know which option to use.' as StreamSignal['context'],
  });

const NeedsUserInputSignalWithQuestionOnlyStub = (): StreamSignal =>
  StreamSignalStub({
    signal: 'needs-user-input',
    question: 'What is your preference?' as StreamSignal['question'],
  });

const NeedsUserInputSignalWithNeitherStub = (): StreamSignal =>
  StreamSignalStub({
    signal: 'needs-user-input',
  });

describe('isValidNeedsUserInputSignalGuard', () => {
  describe('valid signals', () => {
    it('VALID: {signal: needs-user-input with question and context} => returns true', () => {
      const signal = NeedsUserInputSignalWithQuestionAndContextStub();

      const result = isValidNeedsUserInputSignalGuard({ signal });

      expect(result).toBe(true);
    });
  });

  describe('invalid signals', () => {
    it('INVALID_QUESTION: {signal: needs-user-input without question} => returns false', () => {
      const signal = NeedsUserInputSignalWithContextOnlyStub();

      const result = isValidNeedsUserInputSignalGuard({ signal });

      expect(result).toBe(false);
    });

    it('INVALID_CONTEXT: {signal: needs-user-input without context} => returns false', () => {
      const signal = NeedsUserInputSignalWithQuestionOnlyStub();

      const result = isValidNeedsUserInputSignalGuard({ signal });

      expect(result).toBe(false);
    });

    it('INVALID_MULTIPLE: {signal: needs-user-input without question and context} => returns false', () => {
      const signal = NeedsUserInputSignalWithNeitherStub();

      const result = isValidNeedsUserInputSignalGuard({ signal });

      expect(result).toBe(false);
    });

    it('INVALID_SIGNAL_TYPE: {signal: complete} => returns false', () => {
      const signal = StreamSignalStub({
        signal: 'complete',
        summary: 'Done' as StreamSignal['summary'],
      });

      const result = isValidNeedsUserInputSignalGuard({ signal });

      expect(result).toBe(false);
    });

    it('INVALID_SIGNAL_TYPE: {signal: partially-complete} => returns false', () => {
      const signal = StreamSignalStub({
        signal: 'partially-complete',
        progress: 'Made some progress' as StreamSignal['progress'],
        continuationPoint: 'Continue from here' as StreamSignal['continuationPoint'],
      });

      const result = isValidNeedsUserInputSignalGuard({ signal });

      expect(result).toBe(false);
    });

    it('INVALID_SIGNAL_TYPE: {signal: needs-role-followup} => returns false', () => {
      const signal = StreamSignalStub({
        signal: 'needs-role-followup',
        targetRole: 'reviewer' as StreamSignal['targetRole'],
        reason: 'Code review needed' as StreamSignal['reason'],
        resume: true as StreamSignal['resume'],
      });

      const result = isValidNeedsUserInputSignalGuard({ signal });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {signal: undefined} => returns false', () => {
      const result = isValidNeedsUserInputSignalGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {signal: null} => returns false', () => {
      const result = isValidNeedsUserInputSignalGuard({ signal: null });

      expect(result).toBe(false);
    });
  });
});
