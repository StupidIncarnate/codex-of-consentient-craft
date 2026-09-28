/**
 * PURPOSE: Reads the `adapter-census` flags out of an argument list: `--cwd=<repo root>`,
 * `--format=table|json` and `--package=<name, folder or folder name>`. A flag left out is absent
 * (`format` defaults to `table`). The last occurrence of a repeated flag wins.
 *
 * USAGE:
 * censusArgsParseTransformer({ args: ['--format=json', '--package=lib'] });
 * // Returns { format: 'json', packageFilter: 'lib' }
 */
import { censusArgsContract } from '../../contracts/census-args/census-args-contract';
import type { CensusArgs } from '../../contracts/census-args/census-args-contract';

export const censusArgsParseTransformer = ({ args }: { args: readonly string[] }): CensusArgs => {
  const cwd = args
    .filter((arg) => arg.startsWith('--cwd='))
    .at(-1)
    ?.slice('--cwd='.length);
  const format = args
    .filter((arg) => arg.startsWith('--format='))
    .at(-1)
    ?.slice('--format='.length);
  const packageFilter = args
    .filter((arg) => arg.startsWith('--package='))
    .at(-1)
    ?.slice('--package='.length);

  return censusArgsContract.parse({
    ...(cwd === undefined ? {} : { cwd }),
    format: format ?? 'table',
    ...(packageFilter === undefined ? {} : { packageFilter }),
  });
};
