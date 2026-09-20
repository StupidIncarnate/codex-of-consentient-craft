/**
 * PURPOSE: Copies each local image path a scan already found into the quest's own images folder,
 * so a token can point at a file that survives the original being deleted. Reach for this once
 * localImagePathsFindTransformer has produced matches and the caller has already created
 * imagesDirPath — this broker never mkdirs and never rewrites message text, it only moves bytes
 * and reports where each ordinal's copy landed.
 *
 * USAGE:
 * const copied = await localImageCopyBroker({ matches, imagesDirPath });
 * // Returns a map from each match's ordinal to the AbsoluteFilePath its bytes were copied to.
 * // A match that is not a served image type, whose source is unreadable, or whose destination
 * // write fails is simply absent from the map — the broker itself always resolves.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileBytesAdapter } from '../../../adapters/fs/read-file-bytes/fs-read-file-bytes-adapter';
import { fsWriteFileBytesAdapter } from '../../../adapters/fs/write-file-bytes/fs-write-file-bytes-adapter';
import type { LocalImagePathMatch } from '../../../contracts/local-image-path-match/local-image-path-match-contract';
import type { PastedImageOrdinal } from '../../../contracts/pasted-image-ordinal/pasted-image-ordinal-contract';
import { imageContentTypeTransformer } from '../../../transformers/image-content-type/image-content-type-transformer';

export const localImageCopyBroker = async ({
  matches,
  imagesDirPath,
}: {
  matches: readonly LocalImagePathMatch[];
  imagesDirPath: AbsoluteFilePath;
}): Promise<ReadonlyMap<PastedImageOrdinal, AbsoluteFilePath>> => {
  const copied = await Promise.all(
    matches.map(
      async (match): Promise<readonly [PastedImageOrdinal, AbsoluteFilePath] | undefined> => {
        if (imageContentTypeTransformer({ filePath: match.path }) === null) {
          process.stderr.write(
            `[local-image-copy-broker] skipped ${match.path}: not a served image type\n`,
          );
          return undefined;
        }

        // Minted synchronously, before the read below's await — so the mint order always matches
        // match order rather than whichever match's read happens to resolve first.
        //
        // Lowercased: the scan folds case, so a `Shot.PNG` is admitted here, and naming the copy
        // `<uuid>.PNG` would put a capitalised extension into a filename nothing but this line ever
        // chooses. The serve route lowercases before reading its content-type map either way, so
        // this changes no behaviour there — it keeps the quest's images directory uniform.
        const extension = match.path.slice(match.path.lastIndexOf('.') + 1).toLowerCase();
        const destination = absoluteFilePathContract.parse(
          pathJoinAdapter({ paths: [imagesDirPath, `${crypto.randomUUID()}.${extension}`] }),
        );

        try {
          const bytes = await fsReadFileBytesAdapter({ filePath: match.path });

          try {
            await fsWriteFileBytesAdapter({ filePath: destination, bytes });
          } catch (writeError: unknown) {
            process.stderr.write(
              `[local-image-copy-broker] failed to write ${destination}: ${String(writeError)}\n`,
            );
            return undefined;
          }

          return [match.ordinal, destination] as const;
        } catch (readError: unknown) {
          process.stderr.write(
            `[local-image-copy-broker] failed to read ${match.path}: ${String(readError)}\n`,
          );
          return undefined;
        }
      },
    ),
  );

  return new Map(
    copied.filter(
      (entry): entry is readonly [PastedImageOrdinal, AbsoluteFilePath] => entry !== undefined,
    ),
  );
};
