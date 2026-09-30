/**
 * PURPOSE: Wraps one inline `xxxContract.parse(value)` call so a bad flag value answers with the
 * contract's own message under the FLAG's name, never the raw ZodError issue array a caller would
 * otherwise have to read past — every hand-written refusal in this package is one clean sentence,
 * and a branded contract's own throw is the one path that was not. Takes `parse` as a callback
 * rather than `{contract, value}`: the return type then comes from ordinary single-call generic
 * inference, where typing a `contract` parameter compatible with every branded schema in this
 * package risks silently widening or narrowing what the real call validates. "Was this thrown value a
 * ZodError" is an `instanceof z.ZodError` check on the gateway's `z`. A caught value that is not a
 * ZodError is not a validation failure and is rethrown exactly as caught.
 *
 * USAGE:
 * flagContractParseTransformer({ flag: '--stop-on', parse: () => stopOnContract.parse('maybe') });
 * // Throws Error('--stop-on must be one of error, never; got "maybe"')
 */

import { z } from '#gateway/npm/zod';

export const flagContractParseTransformer = <T>({
  flag,
  parse,
}: {
  flag: string;
  parse: () => T;
}): T => {
  try {
    return parse();
  } catch (error) {
    if (!(error instanceof z.ZodError)) {
      throw error;
    }

    const { issues } = error;
    const [firstIssue] = issues;

    // A lone enum refusal at the flag's own value answers as `--flag must be one of …`, the
    // sentence `enumFlagParseTransformer` prints, so every enum flag reads the same whichever
    // parser reached it. Zod 4 reports an enum miss as `invalid_value` carrying `values`; the typed
    // text rides along as `input` only when the parse ran with `reportInput`, so `got "…"` appears
    // only then, and only as text. One value is a literal, which keeps Zod's own message.
    if (
      issues.length === 1 &&
      firstIssue?.code === 'invalid_value' &&
      firstIssue.path.length === 0 &&
      firstIssue.values.length > 1
    ) {
      const got = typeof firstIssue.input === 'string' ? `; got "${firstIssue.input}"` : '';
      throw new Error(`${flag} must be one of ${firstIssue.values.join(', ')}${got}`, {
        cause: error,
      });
    }

    const detail = issues
      .map((issue) => {
        const message =
          issue.code === 'invalid_value' && issue.values.length > 1
            ? `must be one of ${issue.values.join(', ')}${
                typeof issue.input === 'string' ? `; got "${issue.input}"` : ''
              }`
            : issue.message;
        return issue.path.length > 0 ? `${issue.path.join('.')}: ${message}` : message;
      })
      .join('; ');

    throw new Error(`${flag}: ${detail}`, { cause: error });
  }
};
