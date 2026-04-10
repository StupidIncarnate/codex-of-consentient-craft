/**
 * PURPOSE: Validates snippet key and returns the corresponding architecture snippet content
 *
 * USAGE:
 * const result = HookSessionSnippetFlow({ snippetKey: 'discover' });
 * // Returns ExecResult with stdout containing the snippet wrapped in XML tags
 *
 * WHEN-TO-USE: Called by start-session-snippet-hook startup to handle snippet key lookup
 */

import {
  execResultContract,
  type ExecResult,
} from '../../contracts/exec-result/exec-result-contract';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';
import { sessionSnippetStatics } from '@dungeonmaster/shared/statics';
import { isKeyOfGuard } from '@dungeonmaster/shared/guards';
import { HookSessionSnippetPackagesResponder } from '../../responders/hook/session-snippet-packages/hook-session-snippet-packages-responder';
import { buildFolderTypesTableTransformer } from '../../transformers/build-folder-types-table/build-folder-types-table-transformer';

type DynamicKey = {
  [K in keyof typeof sessionSnippetStatics]: (typeof sessionSnippetStatics)[K] extends null
    ? K
    : never;
}[keyof typeof sessionSnippetStatics];

const dynamicGenerators: Record<DynamicKey, () => ContentText> = {
  folderTypes: buildFolderTypesTableTransformer,
  packages: () =>
    HookSessionSnippetPackagesResponder({
      projectRoot: absoluteFilePathContract.parse(process.cwd()),
    }),
};

export const HookSessionSnippetFlow = ({
  snippetKey,
}: {
  snippetKey: string | undefined;
}): ExecResult => {
  if (!snippetKey || !isKeyOfGuard(snippetKey, sessionSnippetStatics)) {
    return execResultContract.parse({
      stderr: `Unknown snippet key: ${snippetKey ?? '(none)'}\n`,
      stdout: '',
      exitCode: 1,
    });
  }

  const staticValue = sessionSnippetStatics[snippetKey];

  if (staticValue === null) {
    const generator = dynamicGenerators[snippetKey as DynamicKey];
    const content = generator();

    return execResultContract.parse({
      stderr: '',
      stdout: `<dungeonmaster-${snippetKey}>\n${content}\n</dungeonmaster-${snippetKey}>\n`,
      exitCode: 0,
    });
  }

  return execResultContract.parse({
    stderr: '',
    stdout: `<dungeonmaster-${snippetKey}>\n${staticValue}\n</dungeonmaster-${snippetKey}>\n`,
    exitCode: 0,
  });
};
