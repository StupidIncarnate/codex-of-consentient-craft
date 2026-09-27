/**
 * PURPOSE: A real `Linter` instance, built through ESLint's own constructor — for a caller staging
 * this subpath's own value instead of hand-typing a fake linter.
 *
 * USAGE:
 * const linter = LinterStub();
 * // Returns a real, freshly constructed eslint Linter
 */
import { Linter } from 'eslint';

export const LinterStub = (): Linter => new Linter();
