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
 * // Throws Error("--stop-on: Invalid enum value. Expected 'error' | 'never', received 'maybe'")
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

    const detail = zodIssueParse.data.issues
      .map((issue) =>
        issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
      )
      .join('; ');

    throw new Error(`${flag}: ${detail}`, { cause: error });
  }
};
