/**
 * PURPOSE: Unwraps a `sh -c '<script>'` (or `bash -c "..."`) shell string down to the script it runs,
 * so `bin-program-spawn-ban` reads the SCRIPT's own program rather than reporting "sh"/"bash" itself.
 *
 * USAGE:
 * shCScriptTransformer({ text: contentTextContract.parse("sh -c 'git status'") });
 * // Returns 'git status' as ContentText
 */
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

const SH_C_PATTERN = /^(?:sh|bash)\s+-c\s+(['"])([\s\S]*)\1$/u;

export const shCScriptTransformer = ({ text }: { text: ContentText }): ContentText | undefined => {
  const match = SH_C_PATTERN.exec(text.trim());
  return match?.[2] === undefined ? undefined : contentTextContract.parse(match[2]);
};
