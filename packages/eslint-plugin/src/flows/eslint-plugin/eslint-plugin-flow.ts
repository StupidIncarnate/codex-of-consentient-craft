/**
 * PURPOSE: Orchestrates ESLint plugin creation by delegating to the create responder
 *
 * USAGE:
 * const plugin = EslintPluginFlow();
 * // Returns the complete ESLint plugin object with rules and configs
 */
import { EslintPluginCreateResponder } from '../../responders/eslint-plugin/create/eslint-plugin-create-responder';

type ResponderResult = ReturnType<typeof EslintPluginCreateResponder>;

export const EslintPluginFlow = (): ResponderResult => EslintPluginCreateResponder();
