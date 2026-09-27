/**
 * PURPOSE: The one write path for the gateway's resolution settings in ANY tsconfig this install
 * step touches — `module`/`moduleResolution: "node16"` with `customConditions: ["source"]` in the
 * root tsconfig.json, and `customConditions: ["gateway-dist", "source"]` in each package's
 * tsconfig.build.json. Edits the text in place, so comments and layout survive. A missing file, or
 * one with no `compilerOptions` block, is a skip.
 *
 * USAGE:
 * await gatewayTsconfigCompilerOptionsWriteBroker({
 *   tsconfigPath: FilePathStub({ value: '/repo/tsconfig.json' }),
 *   options: TsconfigCompilerOptionsStub({ module: 'node16' }),
 * });
 * // Returns true when the file changed; false when it was missing or already held every value
 */

import { fsExistsSyncAdapter } from '@dungeonmaster/shared/adapters';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { typescriptTsconfigCompilerOptionsLocateAdapter } from '../../../adapters/typescript/tsconfig-compiler-options-locate/typescript-tsconfig-compiler-options-locate-adapter';
import { tsconfigCompilerOptionsSetTextTransformer } from '../../../transformers/tsconfig-compiler-options-set-text/tsconfig-compiler-options-set-text-transformer';
import type { TsconfigCompilerOptions } from '../../../contracts/tsconfig-compiler-options/tsconfig-compiler-options-contract';

export const gatewayTsconfigCompilerOptionsWriteBroker = async ({
  tsconfigPath,
  options,
}: {
  tsconfigPath: FilePath;
  options: TsconfigCompilerOptions;
}): Promise<boolean> => {
  if (!fsExistsSyncAdapter({ filePath: tsconfigPath })) {
    return false;
  }

  const tsconfigText = await fsReadFileAdapter({ filePath: tsconfigPath });
  const updatedText = tsconfigCompilerOptionsSetTextTransformer({
    tsconfigText,
    descriptor: typescriptTsconfigCompilerOptionsLocateAdapter({ text: tsconfigText }),
    options,
  });

  if (String(updatedText) === String(tsconfigText)) {
    return false;
  }

  await fsWriteFileAdapter({ filePath: tsconfigPath, contents: updatedText });

  return true;
};
