/**
 * PURPOSE: The path this is handed came off a URL query, so nothing about its SHAPE can say where
 * it lands — only the filesystem can. Every symlink in it is resolved first, and the resolved file
 * is served only from a QUEST'S images directory: the directory holding it must be the one
 * `locationsQuestImagesPathFindBroker` names for its parent (the same broker the write side
 * composes, so the two cannot drift), and that parent must hold a quest file, which is what
 * separates a real quest folder from any other directory that happens to be called `images`.
 * Resolving before comparing is what makes both checks unsteppable: a link planted in a quest's
 * images directory is judged by where it points, not by where it sits. What stays out of reach
 * here is WHICH quest — the request carries a path and no quest id, so one quest's transcript can
 * name another quest's image. Every refusal collapses to the same null rather than a distinct
 * status, because a 403 would tell the caller which paths exist.
 *
 * USAGE:
 * const result = await imageServeBroker({ path: '/tmp/quest/images/abc.png' });
 * // → { bytes, contentType: 'image/png' } when servable, or null for any refusal
 */

import { existsSync } from '#gateway/node/fs';
import { readFileBytes, realpath } from '#gateway/node/fs__promises';
import { dirname, join } from '#gateway/node/path';
import { locationsQuestImagesPathFindBroker } from '@dungeonmaster/shared/brokers';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { processDevLogBroker } from '../../process/dev-log/process-dev-log-broker';
import { isServableImagePathGuard } from '../../../guards/is-servable-image-path/is-servable-image-path-guard';
import { errorFormatReasonTransformer } from '../../../transformers/error-format-reason/error-format-reason-transformer';
import { imageContentTypeTransformer } from '../../../transformers/image-content-type/image-content-type-transformer';
import type { ImageContentType } from '../../../transformers/image-content-type/image-content-type-transformer';

export const imageServeBroker = async ({
  path,
}: {
  path: string;
}): Promise<{ bytes: Uint8Array; contentType: ImageContentType } | null> => {
  if (!isServableImagePathGuard({ path })) {
    return null;
  }

  const filePath = absoluteFilePathContract.parse(path);

  const contentType = imageContentTypeTransformer({ filePath });
  if (contentType === null) {
    return null;
  }

  try {
    // Rejects for a path nothing exists at, which is why the confinement check below never has to
    // reason about a name that resolves to nothing.
    const realFilePath = await realpath(filePath);

    const containingDir = dirname(realFilePath);
    const questFolderPath = absoluteFilePathContract.parse(dirname(containingDir));
    const containingDirPath = absoluteFilePathContract.parse(containingDir);

    if (locationsQuestImagesPathFindBroker({ questFolderPath }) !== containingDirPath) {
      return null;
    }

    // A directory named `images` is common enough on a developer's machine that the name alone
    // does not make one a quest's. The quest file next to it is what does: every quest folder
    // holds one from the moment it is created, and nothing else on the host does by accident.
    const questFilePath = join(questFolderPath, locationsStatics.quest.questFile);
    if (!existsSync(questFilePath)) {
      return null;
    }

    const bytes = await readFileBytes(realFilePath);
    return { bytes, contentType };
  } catch (error: unknown) {
    const reason = errorFormatReasonTransformer({ error });
    processDevLogBroker({ message: `Image read failed for ${filePath}: ${reason}` });
    return null;
  }
};
