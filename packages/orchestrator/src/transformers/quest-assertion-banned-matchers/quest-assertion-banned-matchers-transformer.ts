/**
 * PURPOSE: Returns descriptions of step assertions whose input/expected text contains banned jest matcher syntax
 *
 * USAGE:
 * questAssertionBannedMatchersTransformer({steps});
 * // Returns ErrorMessage[] — e.g. ["step 'login-broker' assertion VALID input uses banned matcher '.toContain('"].
 *
 * Behavioral assertions in step.assertions[].input / step.assertions[].expected describe inputs
 * and outcomes in prose. They must NOT contain jest matcher syntax — that signals the assertion
 * was authored as test code (which belongs in the actual test file) rather than as a behavioral
 * predicate description. The canonical banned list lives in `bannedJestMatchersStatics`; each
 * entry includes punctuation so legitimate narrative wording (e.g. "the result toEqual flag")
 * never matches — only literal jest-matcher syntax does.
 */
import type { DependencyStepStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';
import { bannedJestMatchersStatics } from '@dungeonmaster/shared/statics';

type DependencyStep = ReturnType<typeof DependencyStepStub>;

export const questAssertionBannedMatchersTransformer = ({
  steps,
}: {
  steps?: DependencyStep[];
}): ErrorMessage[] => {
  if (!steps) {
    return [];
  }

  const offenders: ErrorMessage[] = [];

  for (const step of steps) {
    for (const assertion of step.assertions) {
      for (const matcher of bannedJestMatchersStatics.proseTokens) {
        if (assertion.input.includes(matcher)) {
          offenders.push(
            errorMessageContract.parse(
              `step '${step.id}' assertion ${assertion.prefix} input uses banned matcher '${matcher}'`,
            ),
          );
        }
        if (assertion.expected.includes(matcher)) {
          offenders.push(
            errorMessageContract.parse(
              `step '${step.id}' assertion ${assertion.prefix} expected uses banned matcher '${matcher}'`,
            ),
          );
        }
      }
    }
  }

  return offenders;
};
