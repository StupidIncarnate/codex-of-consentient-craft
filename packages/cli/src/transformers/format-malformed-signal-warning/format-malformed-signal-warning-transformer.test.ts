/**
 * Tests for formatMalformedSignalWarningTransformer
 */

import { formatMalformedSignalWarningTransformer } from './format-malformed-signal-warning-transformer';
import { StreamSignalStub } from '../../contracts/stream-signal/stream-signal.stub';

type StreamSignal = ReturnType<typeof StreamSignalStub>;

// Helper stubs for signals with specific configurations
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

describe('formatMalformedSignalWarningTransformer', () => {
  describe('valid signals (no warning)', () => {
    it('VALID: {signal: needs-user-input with question and context} => returns null', () => {
      const signal = NeedsUserInputSignalWithQuestionAndContextStub();

      const result = formatMalformedSignalWarningTransformer({ signal });

      expect(result).toBeNull();
    });

    it('VALID: {signal: complete} => returns null', () => {
      const signal = StreamSignalStub({
        signal: 'complete',
        summary: 'Done' as StreamSignal['summary'],
      });

      const result = formatMalformedSignalWarningTransformer({ signal });

      expect(result).toBeNull();
    });

    it('VALID: {signal: partially-complete} => returns null', () => {
      const signal = StreamSignalStub({
        signal: 'partially-complete',
        progress: 'Made some progress' as StreamSignal['progress'],
        continuationPoint: 'Continue from here' as StreamSignal['continuationPoint'],
      });

      const result = formatMalformedSignalWarningTransformer({ signal });

      expect(result).toBeNull();
    });

    it('VALID: {signal: needs-role-followup} => returns null', () => {
      const signal = StreamSignalStub({
        signal: 'needs-role-followup',
        targetRole: 'reviewer' as StreamSignal['targetRole'],
        reason: 'Code review needed' as StreamSignal['reason'],
        resume: true as StreamSignal['resume'],
      });

      const result = formatMalformedSignalWarningTransformer({ signal });

      expect(result).toBeNull();
    });
  });

  describe('malformed signals (returns warning)', () => {
    it('INVALID_QUESTION: {signal: needs-user-input without question} => returns warning about missing question', () => {
      const signal = NeedsUserInputSignalWithContextOnlyStub();

      const result = formatMalformedSignalWarningTransformer({ signal });

      expect(result).toBe(
        'Warning: Received needs-user-input signal but missing required field(s): question. Returning to menu.',
      );
    });

    it('INVALID_CONTEXT: {signal: needs-user-input without context} => returns warning about missing context', () => {
      const signal = NeedsUserInputSignalWithQuestionOnlyStub();

      const result = formatMalformedSignalWarningTransformer({ signal });

      expect(result).toBe(
        'Warning: Received needs-user-input signal but missing required field(s): context. Returning to menu.',
      );
    });

    it('INVALID_MULTIPLE: {signal: needs-user-input without question and context} => returns warning about both fields', () => {
      const signal = NeedsUserInputSignalWithNeitherStub();

      const result = formatMalformedSignalWarningTransformer({ signal });

      expect(result).toBe(
        'Warning: Received needs-user-input signal but missing required field(s): question and context. Returning to menu.',
      );
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {signal: undefined} => returns null', () => {
      const result = formatMalformedSignalWarningTransformer({});

      expect(result).toBeNull();
    });

    it('EMPTY: {signal: null} => returns null', () => {
      const result = formatMalformedSignalWarningTransformer({ signal: null });

      expect(result).toBeNull();
    });
  });
});
