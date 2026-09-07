/**
 * PURPOSE: Answers the get-syntax-rules tool with a redirect. The rules themselves live in
 * `get-architecture`, under "Writing a File" — they were only ever read alongside the folder rules,
 * and keeping a second copy here let the two drift apart.
 *
 * USAGE:
 * const markdown = architectureSyntaxRulesBroker();
 * // Returns ContentText naming get-architecture as the place to look
 */
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';

export const architectureSyntaxRulesBroker = (): ContentText =>
  contentTextContract.parse(
    `# Universal Syntax Rules

These live in \`get-architecture\`, under **Writing a File**: filenames, exports, parameter and
return shape, the file header, types, control flow, error handling and CLI output.

Call \`get-architecture\` instead. \`get-testing-patterns\` still owns assertions, the proxy pattern
and mocking.
`,
  );
