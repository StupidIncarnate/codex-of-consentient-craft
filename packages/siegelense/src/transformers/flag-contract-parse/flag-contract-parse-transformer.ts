/**
 * PURPOSE: Wraps one inline `xxxContract.parse(value)` call so a bad flag value answers with the
 * contract's own message under the FLAG's name, never the raw ZodError issue array a caller would
 * otherwise have to read past — every hand-written refusal in this package is one clean sentence,
 * and a branded contract's own throw is the one path that was not. Takes `parse` as a callback
 * rather than `{contract, value}`: the return type then comes from ordinary single-call generic
 * inference, where typing a `contract` parameter compatible with every branded schema in this
 * package risks silently widening or narrowing what the real call validates. `zodIssueErrorContract`
 * is what makes the check legal from `transformers/`: only `contracts/` may import `zod`, so "was
 * this thrown value a ZodError" is answered by parsing its SHAPE through a contract rather than an
 * `instanceof` this file could never write. A caught value that does not match that shape is not a
 * validation failure and is rethrown exactly as caught.
 *
 * USAGE:
 * flagContractParseTransformer({ flag: '--stop-on', parse: () => stopOnContract.parse('maybe') });
 * // Throws Error('--stop-on must be one of error, never; got "maybe"')
 */

import { zodIssueErrorContract } from '../../contracts/zod-issue-error/zod-issue-error-contract';

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
    const zodIssueParse = zodIssueErrorContract.safeParse(error);
    if (!zodIssueParse.success) {
      throw error;
    }

    const { issues } = zodIssueParse.data;
    const [firstIssue] = issues;

    // A lone enum refusal at the flag's own value answers as `--flag must be one of …; got "x"`,
    // the sentence `enumFlagParseTransformer` prints, so every enum flag reads the same whichever
    // parser reached it.
    if (
      issues.length === 1 &&
      firstIssue?.code === 'invalid_enum_value' &&
      firstIssue.path.length === 0 &&
      firstIssue.options !== undefined &&
      firstIssue.received !== undefined
    ) {
      throw new Error(
        `${flag} must be one of ${firstIssue.options.join(', ')}; got "${String(firstIssue.received)}"`,
        { cause: error },
      );
    }

    const detail = issues
      .map((issue) => {
        const message =
          issue.code === 'invalid_enum_value' &&
          issue.options !== undefined &&
          issue.received !== undefined
            ? `must be one of ${issue.options.join(', ')}; got "${String(issue.received)}"`
            : issue.message;
        return issue.path.length > 0 ? `${issue.path.join('.')}: ${message}` : message;
      })
      .join('; ');

    throw new Error(`${flag}: ${detail}`, { cause: error });
  }
};
