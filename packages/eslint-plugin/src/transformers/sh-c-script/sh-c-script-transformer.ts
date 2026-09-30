/**
 * PURPOSE: Unwraps a `sh -c '<script>'` (or `bash -c "..."`) shell string down to the script it runs,
 * so `bin-program-spawn-ban` reads the SCRIPT's own program rather than reporting "sh"/"bash" itself.
 *
 * USAGE:
 * shCScriptTransformer({ text: contentTextContract.parse("sh -c 'git status'") });
 * // Returns 'git status' as ContentText
 */

const SH_C_PATTERN = /^(?:sh|bash)\s+-c\s+(['"])([\s\S]*)\1$/u;

export const shCScriptTransformer = ({ text }: { text: string }): string | undefined => {
  const match = SH_C_PATTERN.exec(text.trim());
  return match?.[2] === undefined ? undefined : match[2];
};
