/**
 * PURPOSE: Orchestrates local-eslint plugin creation by delegating to the create responder
 *
 * USAGE:
 * const plugin = LocalEslintFlow();
 * // Returns the complete local ESLint plugin object with rules
 */
import { LocalEslintCreateResponder } from '../../responders/local-eslint/create/local-eslint-create-responder';

type ResponderResult = ReturnType<typeof LocalEslintCreateResponder>;

export const LocalEslintFlow = (): ResponderResult => LocalEslintCreateResponder();
