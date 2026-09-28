/**
 * PURPOSE: Lays one row of the census table out in fixed-width columns, so every row of a package
 * block lines up under its header. The last column is not padded, so a row carries no trailing space.
 *
 * USAGE:
 * censusTableLineTransformer({ cells: ['a', 'b'], widths: [4, 4] });
 * // Returns 'a     b'
 */
import { processOutputContract } from '../../contracts/process-output/process-output-contract';
import { censusLayoutStatics } from '../../statics/census-layout/census-layout-statics';
import type { ProcessOutput } from '../../contracts/process-output/process-output-contract';

export const censusTableLineTransformer = ({
  cells,
  widths,
}: {
  cells: readonly string[];
  widths: readonly number[];
}): ProcessOutput =>
  processOutputContract.parse(
    cells
      .map((cell, column) => cell.padEnd(widths[column] ?? 0))
      .join(censusLayoutStatics.tableColumnGap)
      .trimEnd(),
  );
