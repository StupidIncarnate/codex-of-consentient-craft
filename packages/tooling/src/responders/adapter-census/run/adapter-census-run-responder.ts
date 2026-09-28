/**
 * PURPOSE: Runs the census and prints it: a short per-package table by default, the full JSON
 * document with `--format=json`. Flags: `--cwd=<repo root>` (the current directory by default),
 * `--format=table|json`, `--package=<name, folder or folder name>`.
 *
 * USAGE:
 * await AdapterCensusRunResponder({ args: process.argv.slice(2) });
 * // Writes the census to stdout
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import { cwd as processCwd } from '#gateway/node/process';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { adapterCensusRunBroker } from '../../../brokers/adapter-census/run/adapter-census-run-broker';
import { censusArgsParseTransformer } from '../../../transformers/census-args-parse/census-args-parse-transformer';
import { censusTableRenderTransformer } from '../../../transformers/census-table-render/census-table-render-transformer';
import { censusLayoutStatics } from '../../../statics/census-layout/census-layout-statics';

export const AdapterCensusRunResponder = async ({
  args,
}: {
  args: readonly string[];
}): Promise<AdapterResult> => {
  const { cwd, format, packageFilter } = censusArgsParseTransformer({ args });

  const census = await adapterCensusRunBroker({
    repoRoot: cwd ?? absoluteFilePathContract.parse(processCwd()),
    ...(packageFilter === undefined ? {} : { packageFilter }),
  });

  process.stdout.write(
    format === 'json'
      ? `${JSON.stringify(census, null, censusLayoutStatics.jsonIndent)}\n`
      : censusTableRenderTransformer({ census }),
  );

  return adapterResultContract.parse({ success: true });
};
