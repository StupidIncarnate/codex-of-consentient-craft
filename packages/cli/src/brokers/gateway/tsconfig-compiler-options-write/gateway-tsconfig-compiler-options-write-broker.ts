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

import { existsSync } from '#gateway/node/fs';
import { readFile, writeFile } from '#gateway/node/fs__promises';
import { tsconfigCompilerOptionsLocateTransformer } from '../../../transformers/tsconfig-compiler-options-locate/tsconfig-compiler-options-locate-transformer';
import { tsconfigCompilerOptionsSetTextTransformer } from '../../../transformers/tsconfig-compiler-options-set-text/tsconfig-compiler-options-set-text-transformer';
import type { TsconfigCompilerOptions } from '../../../contracts/tsconfig-compiler-options/tsconfig-compiler-options-contract';

export const gatewayTsconfigCompilerOptionsWriteBroker = async ({
  tsconfigPath,
  options,
}: {
  tsconfigPath: string;
  options: TsconfigCompilerOptions;
}): Promise<boolean> => {
  if (!existsSync(tsconfigPath)) {
    return false;
  }

  const tsconfigText = await readFile(tsconfigPath);
  const updatedText = tsconfigCompilerOptionsSetTextTransformer({
    tsconfigText,
    descriptor: tsconfigCompilerOptionsLocateTransformer({ text: tsconfigText }),
    options,
  });

  if (updatedText === tsconfigText) {
    return false;
  }

  await writeFile(tsconfigPath, updatedText);

  return true;
};
