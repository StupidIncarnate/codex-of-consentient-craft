/**
 * PURPOSE: Validates snippet key and returns the corresponding architecture snippet content
 *
 * USAGE:
 * const result = HookSessionSnippetFlow({ snippetKey: 'discover', hookInput: parsedStdin });
 * // Returns ExecResult with stdout containing the snippet wrapped in XML tags
 * // For SubagentStart hookInput: stdout is JSON with additionalContext for sub-agent injection
 *
 * WHEN-TO-USE: Called by start-session-snippet-hook startup to handle snippet key lookup
 */

import {
  execResultContract,
  type ExecResult,
} from '../../contracts/exec-result/exec-result-contract';
import { baseHookDataContract } from '../../contracts/base-hook-data/base-hook-data-contract';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';
import { sessionSnippetStatics } from '@dungeonmaster/shared/statics';
import { isKeyOfGuard } from '@dungeonmaster/shared/guards';
import { HookSessionSnippetPackagesResponder } from '../../responders/hook/session-snippet-packages/hook-session-snippet-packages-responder';
import { buildFolderTypesTableTransformer } from '../../transformers/build-folder-types-table/build-folder-types-table-transformer';
import { wrapSubagentStartOutputTransformer } from '../../transformers/wrap-subagent-start-output/wrap-subagent-start-output-transformer';

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
  hookInput,
}: {
  snippetKey: string | undefined;
  hookInput: unknown;
}): ExecResult => {
  if (!snippetKey || !isKeyOfGuard(snippetKey, sessionSnippetStatics)) {
    return execResultContract.parse({
      stderr: `Unknown snippet key: ${snippetKey ?? '(none)'}\n`,
      stdout: '',
      exitCode: 1,
    });
  }

  const staticValue = sessionSnippetStatics[snippetKey];

  const rawContent =
    staticValue === null ? dynamicGenerators[snippetKey as DynamicKey]() : staticValue;

  const xmlTagged = execResultContract.shape.stdout.parse(
    `<dungeonmaster-${snippetKey}>\n${rawContent}\n</dungeonmaster-${snippetKey}>\n`,
  );

  const parsed = baseHookDataContract.safeParse(hookInput);
  const stdout =
    parsed.success && String(parsed.data.hook_event_name) === 'SubagentStart'
      ? wrapSubagentStartOutputTransformer({ content: xmlTagged })
      : xmlTagged;

  return execResultContract.parse({
    stderr: '',
    stdout,
    exitCode: 0,
  });
};
