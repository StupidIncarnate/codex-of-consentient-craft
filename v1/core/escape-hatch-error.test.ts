import { EscapeHatchError } from './escape-hatch-error';
import type { AgentReport } from '../models/agent';

describe('EscapeHatchError', () => {
  describe('constructor', () => {
    describe('when creating with valid escape data', () => {
      it.each([
        ['task_too_complex' as const],
        ['context_exhaustion' as const],
        ['unexpected_dependencies' as const],
        ['integration_conflict' as const],
        ['repeated_failures' as const],
      ])('reason: "%s" → creates error with that reason as message', (reason) => {
        const escapeData: NonNullable<AgentReport['escape']> = {
          reason,
          analysis: 'Task requires breaking down into smaller pieces',
          recommendation: 'Split the task into 3 subtasks',
          retro: 'Complex integrations need decomposition',
        };

        const error = new EscapeHatchError(escapeData);

        expect(error.message).toBe(reason);
      });

      it('extends Error class', () => {
        const escapeData: NonNullable<AgentReport['escape']> = {
          reason: 'task_too_complex',
          analysis: 'Task requires breaking down into smaller pieces',
          recommendation: 'Split the task into 3 subtasks',
          retro: 'Complex integrations need decomposition',
        };

        const error = new EscapeHatchError(escapeData);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(EscapeHatchError);
      });

      it('sets name property to "EscapeHatchError"', () => {
        const escapeData: NonNullable<AgentReport['escape']> = {
          reason: 'context_exhaustion',
          analysis: 'Context window exceeded',
          recommendation: 'Reduce scope of analysis',
          retro: 'Need better context management',
        };

        const error = new EscapeHatchError(escapeData);

        expect(error.name).toBe('EscapeHatchError');
      });

      it('stores complete escape data as public property', () => {
        const escapeData: NonNullable<AgentReport['escape']> = {
          reason: 'unexpected_dependencies',
          analysis: 'Found circular dependencies in module graph',
          recommendation: 'Refactor to break circular dependencies',
          retro: 'Architecture needs dependency inversion',
        };

        const error = new EscapeHatchError(escapeData);

        expect(error.escape).toStrictEqual(escapeData);
      });

      it('escape data with partialWork → stores all properties including partialWork', () => {
        const escapeData: NonNullable<AgentReport['escape']> = {
          reason: 'repeated_failures',
          analysis: 'Tests keep failing after multiple attempts',
          recommendation: 'Debug test environment setup',
          retro: 'Environment configuration was incorrect',
          partialWork: 'Completed 2 out of 5 test files',
        };

        const error = new EscapeHatchError(escapeData);

        expect(error.escape).toStrictEqual(escapeData);
        expect(error.message).toBe('repeated_failures');
      });
    });

    describe('error properties integration', () => {
      it('all properties work together correctly', () => {
        const escapeData: NonNullable<AgentReport['escape']> = {
          reason: 'integration_conflict',
          analysis: 'Multiple systems trying to modify same resource',
          recommendation: 'Implement proper locking mechanism',
          retro: 'Concurrent access patterns need review',
        };

        const error = new EscapeHatchError(escapeData);

        // Test all properties together to ensure no property bleedthrough
        expect({
          name: error.name,
          message: error.message,
          escape: error.escape,
        }).toStrictEqual({
          name: 'EscapeHatchError',
          message: 'integration_conflict',
          escape: escapeData,
        });
      });
    });

    describe('error behavior', () => {
      it('can be thrown and caught like standard Error', () => {
        const escapeData: NonNullable<AgentReport['escape']> = {
          reason: 'task_too_complex',
          analysis: 'Task requires AI capabilities beyond current model',
          recommendation: 'Break down into smaller, focused tasks',
          retro: 'Task decomposition is critical for success',
        };

        const throwError = () => {
          throw new EscapeHatchError(escapeData);
        };

        expect(throwError).toThrow(EscapeHatchError);
        expect(throwError).toThrow('task_too_complex');
      });

      it('instanceof checks work correctly in catch blocks', () => {
        const escapeData: NonNullable<AgentReport['escape']> = {
          reason: 'context_exhaustion',
          analysis: 'Ran out of context window',
          recommendation: 'Summarize and continue in new session',
          retro: 'Need better context management strategies',
        };

        let caughtError: unknown;
        let isEscapeHatchError = false;
        let hasCorrectEscapeData = false;

        try {
          throw new EscapeHatchError(escapeData);
        } catch (error) {
          caughtError = error;
          isEscapeHatchError = error instanceof EscapeHatchError;
          if (error instanceof EscapeHatchError) {
            hasCorrectEscapeData = JSON.stringify(error.escape) === JSON.stringify(escapeData);
          }
        }

        expect(caughtError).toBeInstanceOf(EscapeHatchError);
        expect(caughtError).toBeInstanceOf(Error);
        expect(isEscapeHatchError).toBe(true);
        expect(hasCorrectEscapeData).toBe(true);
      });
    });
  });
});
