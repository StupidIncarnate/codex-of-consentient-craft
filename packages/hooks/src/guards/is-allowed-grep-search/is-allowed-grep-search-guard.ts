/**
 * PURPOSE: Checks if a Grep search should be allowed through (content/syntax search that discover can't replace)
 *
 * USAGE:
 * isAllowedGrepSearchGuard({ input: GrepToolInputStub({ output_mode: 'content' }) });
 * // Returns true — content mode is a legitimate code search
 */
import type { GrepToolInput } from '../../contracts/grep-tool-input/grep-tool-input-contract';

const REGEX_METACHAR_PATTERN = /[.*+?^${}()|[\]\\]/u;
const NON_TS_EXTENSION_PATTERN =
  /\*\.(json|md|yaml|yml|css|scss|html|svg|png|jpg|env|sh|toml|lock)$/u;
const FILE_EXTENSION_IN_PATH = /\.\w+$/u;
const TS_JS_TYPES = new Set(['ts', 'tsx', 'js', 'jsx']);

export const isAllowedGrepSearchGuard = ({ input }: { input?: GrepToolInput }): boolean => {
  if (!input) {
    return false;
  }

  if (input.output_mode === 'content' || input.output_mode === 'count') {
    return true;
  }

  if (
    input['-A'] !== undefined ||
    input['-B'] !== undefined ||
    input['-C'] !== undefined ||
    input.context !== undefined
  ) {
    return true;
  }

  if (input.path && FILE_EXTENSION_IN_PATH.test(String(input.path))) {
    return true;
  }

  if (input.glob && NON_TS_EXTENSION_PATTERN.test(String(input.glob))) {
    return true;
  }

  if (input.type && !TS_JS_TYPES.has(String(input.type))) {
    return true;
  }

  if (REGEX_METACHAR_PATTERN.test(String(input.pattern))) {
    return true;
  }

  if (input.multiline === true) {
    return true;
  }

  return false;
};
