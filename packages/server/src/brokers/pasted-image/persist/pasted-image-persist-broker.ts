/**
 * PURPOSE: Writes each pasted-chat-image attachment to the quest's images directory and rewrites
 * the message's placeholder tokens to the paths it wrote. Names every file from a freshly minted id
 * rather than a hash of its bytes: two sends carrying byte-identical images — or the same clipboard
 * item pasted twice inside one message — must land as two distinct files, because an earlier
 * message's token has to keep resolving to the exact file it named even after a later send has run.
 * Naming by content hash would deduplicate them, and a later write could then silently replace what
 * an older transcript's token still points at.
 *
 * USAGE:
 * const rewritten = await pastedImagePersistBroker({ guildId, questId, message, images });
 * // Writes each image under the quest's images dir and returns the message with its tokens rewritten
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  locationsQuestFolderPathFindBroker,
  locationsQuestImagesPathFindBroker,
} from '@dungeonmaster/shared/brokers';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, PastedImageUpload, QuestId } from '@dungeonmaster/shared/contracts';

import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { fsWriteFileBase64Adapter } from '../../../adapters/fs/write-file-base64/fs-write-file-base64-adapter';
import type { UserMessage } from '../../../contracts/user-message/user-message-contract';
import { pastedImageTokenSubstituteTransformer } from '../../../transformers/pasted-image-token-substitute/pasted-image-token-substitute-transformer';

export const pastedImagePersistBroker = async ({
  guildId,
  questId,
  message,
  images,
}: {
  guildId: GuildId;
  questId: QuestId;
  message: string;
  images: readonly PastedImageUpload[];
}): Promise<UserMessage> => {
  const questFolderPath = locationsQuestFolderPathFindBroker({ guildId, questId });
  const imagesDirPath = locationsQuestImagesPathFindBroker({ questFolderPath });

  await fsMkdirAdapter({ dirPath: imagesDirPath });

  const imagePaths = await Promise.all(
    images.map(async (image) => {
      const extension = image.mediaType.split('/')[1] ?? '';
      const filePath = absoluteFilePathContract.parse(
        pathJoinAdapter({ paths: [imagesDirPath, `${crypto.randomUUID()}.${extension}`] }),
      );

      await fsWriteFileBase64Adapter({ filePath, dataBase64: image.dataBase64 });

      return filePath;
    }),
  );

  return pastedImageTokenSubstituteTransformer({ message, imagePaths });
};
