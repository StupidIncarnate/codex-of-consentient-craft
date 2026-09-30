/**
 * PURPOSE: Reduces a spawn call's (already-resolved) command text down to the ONE program name the
 * design doc's algorithm cares about — the first whitespace-separated word, unwrapping a `sh -c
 * '<script>'` shell string (as one combined string, or as a `command`/`args` pair split the way
 * `spawn('sh', ['-c', script])` splits them) to the script's own first word instead.
 *
 * USAGE:
 * resolveSpawnedProgramLayerBroker({ commandNode: literalGitNode, argsNode: undefined, moduleBody });
 * // Returns 'git' as ContentText
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { firstWordTransformer } from '../../../transformers/first-word/first-word-transformer';
import { shCScriptTransformer } from '../../../transformers/sh-c-script/sh-c-script-transformer';
import { resolveStaticStringLayerBroker } from './resolve-static-string-layer-broker';

export const resolveSpawnedProgramLayerBroker = ({
  commandNode,
  argsNode,
  moduleBody,
  filename,
}: {
  commandNode: TSESTree.Node | undefined;
  argsNode: TSESTree.Node | undefined;
  moduleBody: readonly TSESTree.ProgramStatement[];
  filename?: string | undefined;
}): string | undefined => {
  const resolvedCommand = resolveStaticStringLayerBroker({
    node: commandNode,
    moduleBody,
    filename,
  });
  if (resolvedCommand === undefined) {
    return undefined;
  }

  // One combined string carries both the shell and its script: exec("sh -c 'git status'").
  const combinedScript = shCScriptTransformer({ text: resolvedCommand });
  if (combinedScript !== undefined) {
    return firstWordTransformer({ text: combinedScript });
  }

  const commandFirstWord = firstWordTransformer({ text: resolvedCommand });
  if (commandFirstWord === undefined) {
    return undefined;
  }

  // The shell and its script are split across command/args: spawn('sh', ['-c', 'git status']).
  const isShellLauncher = commandFirstWord === 'sh' || commandFirstWord === 'bash';
  if (isShellLauncher && argsNode?.type === AST_NODE_TYPES.ArrayExpression) {
    const [flagNode, scriptNode] = argsNode.elements;
    const flag =
      flagNode === null || flagNode === undefined
        ? undefined
        : resolveStaticStringLayerBroker({ node: flagNode, moduleBody, filename });
    const script =
      flag === '-c' && scriptNode !== null && scriptNode !== undefined
        ? resolveStaticStringLayerBroker({ node: scriptNode, moduleBody, filename })
        : undefined;
    if (script !== undefined) {
      return firstWordTransformer({ text: script });
    }
  }

  return commandFirstWord;
};
