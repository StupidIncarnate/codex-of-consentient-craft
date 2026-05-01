/**
 * PURPOSE: Renders the Hooks table section for a hook-handlers package. For each bin entry,
 * traces startup file → flow import name, and annotates spawn/fs-write effects when present.
 *
 * USAGE:
 * const section = hooksSectionRenderLayerBroker({
 *   binEntries: [
 *     { binName: contentTextContract.parse('dungeonmaster-pre-edit-lint'), binPath: contentTextContract.parse('./dist/src/startup/start-pre-edit-hook.js') }
 *   ],
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/hooks'),
 * });
 * // Returns ContentText with ## Hooks header and per-bin rows
 *
 * WHEN-TO-USE: hook-handlers headline broker building the Hooks section
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import type { BinEntry } from '../../../contracts/bin-entry/bin-entry-contract';
import { projectMapHeadlineHookHandlersStatics } from '../../../statics/project-map-headline-hook-handlers/project-map-headline-hook-handlers-statics';
import { hookStartupSrcPathResolveTransformer } from '../../../transformers/hook-startup-src-path-resolve/hook-startup-src-path-resolve-transformer';
import { readSourceLayerBroker } from './read-source-layer-broker';
import { hookResponderLabelResolveLayerBroker } from './hook-responder-label-resolve-layer-broker';
import { hookAnnotationsResolveLayerBroker } from './hook-annotations-resolve-layer-broker';

export const hooksSectionRenderLayerBroker = ({
  binEntries,
  packageRoot,
}: {
  binEntries: BinEntry[];
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const statics = projectMapHeadlineHookHandlersStatics;
  const parts = [statics.hooksSectionHeader, '', '```'];

  if (binEntries.length === 0) {
    parts.push(statics.hooksSectionEmpty);
    parts.push('```');
    return contentTextContract.parse(parts.join('\n'));
  }

  for (const { binName, binPath } of binEntries) {
    const paddedBin = String(binName).padEnd(statics.binNamePadWidth);

    const startupPath = hookStartupSrcPathResolveTransformer({ binPath, packageRoot });
    const startupSource =
      startupPath === undefined ? undefined : readSourceLayerBroker({ filePath: startupPath });

    const responderLabel = hookResponderLabelResolveLayerBroker({ startupSource });
    const { spawnName, fsWritePath } = hookAnnotationsResolveLayerBroker({
      startupSource,
      packageRoot,
    });

    parts.push(`${paddedBin} → ${responderLabel}`);
    if (spawnName !== undefined) {
      parts.push(`${statics.spawnAnnotationPrefix}${String(spawnName)}`);
    }
    if (fsWritePath !== undefined) {
      parts.push(`${statics.fsWriteAnnotationPrefix}${String(fsWritePath)}`);
    }
  }

  parts.push('```');
  return contentTextContract.parse(parts.join('\n'));
};
