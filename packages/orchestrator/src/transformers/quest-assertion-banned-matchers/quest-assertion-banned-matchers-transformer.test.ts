import { DependencyStepStub, StepAssertionStub } from '@dungeonmaster/shared/contracts';

import { questAssertionBannedMatchersTransformer } from './quest-assertion-banned-matchers-transformer';

describe('questAssertionBannedMatchersTransformer', () => {
  describe('no banned matchers', () => {
    it('VALID: {assertions with plain behavioral prose} => returns []', () => {
      const steps = [
        DependencyStepStub({
          id: 'backend-login-broker',
          assertions: [
            StepAssertionStub({
              prefix: 'VALID',
              input: '{ email: "user@example.com", password: "hunter2" }',
              expected: 'returns a session token',
            }),
          ],
        }),
      ];

      const result = questAssertionBannedMatchersTransformer({ steps });

      expect(result).toStrictEqual([]);
    });
  });

  describe('banned matchers present', () => {
    it("INVALID: {assertion input contains '.toContain('} => returns offender for input", () => {
      const steps = [
        DependencyStepStub({
          id: 'backend-login-broker',
          assertions: [
            StepAssertionStub({
              prefix: 'VALID',
              input: 'expect(result).toContain("ok") to be invoked',
              expected: 'returns expected result',
            }),
          ],
        }),
      ];

      const result = questAssertionBannedMatchersTransformer({ steps });

      expect(result).toStrictEqual([
        "step 'backend-login-broker' assertion VALID input uses banned matcher '.toContain('",
      ]);
    });

    it("INVALID: {assertion expected contains '.toMatchObject('} => returns offender for expected", () => {
      const steps = [
        DependencyStepStub({
          id: 'backend-login-broker',
          assertions: [
            StepAssertionStub({
              prefix: 'VALID',
              input: '{valid input}',
              expected: 'response.toMatchObject({ ok: true })',
            }),
          ],
        }),
      ];

      const result = questAssertionBannedMatchersTransformer({ steps });

      expect(result).toStrictEqual([
        "step 'backend-login-broker' assertion VALID expected uses banned matcher '.toMatchObject('",
      ]);
    });

    it("INVALID: {assertion contains 'expect.any('} => returns offender", () => {
      const steps = [
        DependencyStepStub({
          id: 'backend-login-broker',
          assertions: [
            StepAssertionStub({
              prefix: 'VALID',
              input: '{valid input}',
              expected: 'returns { id: expect.any(String) }',
            }),
          ],
        }),
      ];

      const result = questAssertionBannedMatchersTransformer({ steps });

      expect(result).toStrictEqual([
        "step 'backend-login-broker' assertion VALID expected uses banned matcher 'expect.any('",
      ]);
    });
  });

  describe('narrative wording does not match', () => {
    it('EDGE: {prose mentions "toEqual" without dot+paren punctuation} => returns []', () => {
      const steps = [
        DependencyStepStub({
          id: 'backend-login-broker',
          assertions: [
            StepAssertionStub({
              prefix: 'VALID',
              input: 'the result toEqual flag is set',
              expected: 'returns expected result',
            }),
          ],
        }),
      ];

      const result = questAssertionBannedMatchersTransformer({ steps });

      expect(result).toStrictEqual([]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {steps: undefined} => returns []', () => {
      const result = questAssertionBannedMatchersTransformer({});

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {steps: []} => returns []', () => {
      const result = questAssertionBannedMatchersTransformer({ steps: [] });

      expect(result).toStrictEqual([]);
    });
  });
});
