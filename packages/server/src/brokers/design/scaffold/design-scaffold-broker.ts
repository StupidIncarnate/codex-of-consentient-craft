/**
 * PURPOSE: Creates a minimal Vite + React + Mantine scaffold in the quest design directory
 *
 * USAGE:
 * const { designPath } = await designScaffoldBroker({ guildPath, questFolder, port });
 * // Creates design scaffold files at {guildPath}/.dungeonmaster-quests/{questFolder}/design/
 */

import { fsMkdirAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  fileContentsContract,
  filePathContract,
} from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, Quest } from '@dungeonmaster/shared/contracts';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { designScaffoldTemplateStatics } from '../../../statics/design-scaffold-template/design-scaffold-template-statics';

type DesignPort = NonNullable<Quest['designPort']>;

export const designScaffoldBroker = async ({
  guildPath,
  questFolder,
  port,
}: {
  guildPath: AbsoluteFilePath;
  questFolder: string;
  port: DesignPort;
}): Promise<{ designPath: AbsoluteFilePath }> => {
  const questsDir = pathJoinAdapter({
    paths: [guildPath, '.dungeonmaster-quests', questFolder],
  });
  const designPath = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [questsDir, 'design'] }),
  );

  await fsMkdirAdapter({ filepath: filePathContract.parse(designPath) });

  const viteConfigContent = designScaffoldTemplateStatics.files.viteConfig.replace(
    '__PORT__',
    String(port),
  );

  await Promise.all([
    fsWriteFileAdapter({
      filePath: absoluteFilePathContract.parse(
        pathJoinAdapter({ paths: [designPath, 'package.json'] }),
      ),
      content: fileContentsContract.parse(designScaffoldTemplateStatics.files.packageJson),
    }),
    fsWriteFileAdapter({
      filePath: absoluteFilePathContract.parse(
        pathJoinAdapter({ paths: [designPath, 'vite.config.js'] }),
      ),
      content: fileContentsContract.parse(viteConfigContent),
    }),
    fsWriteFileAdapter({
      filePath: absoluteFilePathContract.parse(
        pathJoinAdapter({ paths: [designPath, 'index.html'] }),
      ),
      content: fileContentsContract.parse(designScaffoldTemplateStatics.files.indexHtml),
    }),
    fsWriteFileAdapter({
      filePath: absoluteFilePathContract.parse(
        pathJoinAdapter({ paths: [designPath, 'main.jsx'] }),
      ),
      content: fileContentsContract.parse(designScaffoldTemplateStatics.files.mainJsx),
    }),
  ]);

  return { designPath };
};
