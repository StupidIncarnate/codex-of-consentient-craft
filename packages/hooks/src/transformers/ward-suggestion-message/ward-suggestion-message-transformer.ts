/**
 * PURPOSE: Transforms a blocked bash command into a specific ward suggestion message
 *
 * USAGE:
 * wardSuggestionMessageTransformer({ command: bashToolInputContract.parse({ command: 'npx jest foo.test.ts' }).command });
 * // Returns 'Blocked: direct jest invocation. Use instead: `npx dungeonmaster-ward run --only test -- foo.test.ts`'
 */
import type { BashToolInput } from '../../contracts/bash-tool-input/bash-tool-input-contract';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

import { errorMessageContract } from '@dungeonmaster/shared/contracts';

const NPX_WARD_PATTERN = /npx\s+dungeonmaster-ward(?:\s|$)/u;
const JEST_PATTERN = /(?:npx\s+)?jest(?:\s|$)/u;
const ESLINT_PATTERN = /(?:npx\s+)?eslint(?:\s|$)/u;
const TSC_PATTERN = /(?:npx\s+)?tsc(?:\s|$)/u;
const JEST_PATH_PATTERN = /(?:npx\s+)?jest\s+(.+)/u;

export const wardSuggestionMessageTransformer = ({
  command,
}: {
  command: BashToolInput['command'];
}): ErrorMessage => {
  if (NPX_WARD_PATTERN.test(command)) {
    const wardArgs = command.replace(/npx\s+dungeonmaster-ward\s*/u, '').trim();
    const suggestion = wardArgs ? `npm run ward -- ${wardArgs}` : 'npm run ward';
    return errorMessageContract.parse(
      `Blocked: npx dungeonmaster-ward is banned. Use instead: \`${suggestion}\``,
    );
  }

  if (JEST_PATTERN.test(command)) {
    const pathMatch = JEST_PATH_PATTERN.exec(command);
    const pathArg = pathMatch?.[1]?.trim();
    const suggestion = pathArg
      ? `npm run ward -- --only test -- ${pathArg}`
      : 'npm run ward -- --only test';
    return errorMessageContract.parse(
      `Blocked: direct jest invocation. Use instead: \`${suggestion}\``,
    );
  }

  if (ESLINT_PATTERN.test(command)) {
    return errorMessageContract.parse(
      'Blocked: direct eslint invocation. Use instead: `npm run ward -- --only lint`',
    );
  }

  if (TSC_PATTERN.test(command)) {
    return errorMessageContract.parse(
      'Blocked: direct tsc invocation. Use instead: `npm run ward -- --only typecheck`',
    );
  }

  return errorMessageContract.parse('Blocked: direct tool invocation. Use instead: `npm run ward`');
};
