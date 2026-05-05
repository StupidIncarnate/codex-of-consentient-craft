/**
 * PURPOSE: Resolves a binding identifier (with or without the `-binding` suffix) to its
 * absolute `.ts` source path under `<packageRoot>/src/bindings/<folder>/<name>-binding.ts`,
 * applying the convention that `<binding-name>-binding` lives in folder `<binding-name>`.
 *
 * USAGE:
 * const filePath = bindingNameToFilePathTransformer({
 *   bindingName: contentTextContract.parse('use-quests'),
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/web'),
 * });
 * // Returns AbsoluteFilePath '/repo/packages/web/src/bindings/use-quests/use-quests-binding.ts'
 *
 * WHEN-TO-USE: Both architectureBindingFlowTraceBroker (HTTP/WS edge resolution) and the
 * widget-rendering chain walker need the same binding-name → file-path mapping. Centralising
 * the convention here keeps the two callers in lockstep.
 */

import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';

const BINDING_SUFFIX = '-binding';
const BINDINGS_PATH = '/src/bindings/';

export const bindingNameToFilePathTransformer = ({
  bindingName,
  packageRoot,
}: {
  bindingName: ContentText;
  packageRoot: AbsoluteFilePath;
}): AbsoluteFilePath => {
  const bindingNameStr = String(bindingName);
  const folderName = bindingNameStr.endsWith(BINDING_SUFFIX)
    ? bindingNameStr.slice(0, -BINDING_SUFFIX.length)
    : bindingNameStr;
  const fileBaseName = bindingNameStr.endsWith(BINDING_SUFFIX)
    ? bindingNameStr
    : `${bindingNameStr}${BINDING_SUFFIX}`;

  return absoluteFilePathContract.parse(
    `${String(packageRoot)}${BINDINGS_PATH}${folderName}/${fileBaseName}.ts`,
  );
};
