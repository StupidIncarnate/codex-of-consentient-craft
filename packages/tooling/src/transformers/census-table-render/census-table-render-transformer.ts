/**
 * PURPOSE: Prints a census as a short per-package table for a person. The JSON document carries
 * everything; this shows the columns a planner scans first: each adapter's shape, the gateway
 * export that could replace it, how many production callers and tests import it, how many proxies
 * compose its callers' proxies, how many of those stage a catch-all, and why a logic adapter is one.
 *
 * USAGE:
 * censusTableRenderTransformer({ census });
 * // Returns the table text, one block per package, ending in a totals line
 */
import { processOutputContract } from '../../contracts/process-output/process-output-contract';
import { censusTableLineTransformer } from '../census-table-line/census-table-line-transformer';
import { censusLayoutStatics } from '../../statics/census-layout/census-layout-statics';
import type { AdapterCensus } from '../../contracts/adapter-census/adapter-census-contract';
import type { AdapterRecord } from '../../contracts/adapter-record/adapter-record-contract';
import type { ProcessOutput } from '../../contracts/process-output/process-output-contract';

export const censusTableRenderTransformer = ({
  census,
}: {
  census: AdapterCensus;
}): ProcessOutput => {
  const heading = `Adapter census (scope ${census.scope ?? 'none'})`;
  if (census.packages.length === 0) {
    return processOutputContract.parse(
      `${heading}\nNo adapters found under ${censusLayoutStatics.adaptersSegment.slice(1)}.\n`,
    );
  }

  const blocks = census.packages.map((pkg) => {
    const rows = pkg.adapters.map((adapter: AdapterRecord) => {
      const [first] = adapter.gateway;
      return [
        adapter.file.slice(
          adapter.file.indexOf(censusLayoutStatics.adaptersSegment) +
            censusLayoutStatics.adaptersSegment.length,
        ),
        adapter.shape,
        first === undefined ? '-' : `${first.name} (${first.match})`,
        String(adapter.productionCallers.length),
        String(adapter.testFiles.length),
        String(new Set(adapter.productionCallers.flatMap((caller) => caller.composedBy)).size),
        String(
          new Set(
            adapter.productionCallers.flatMap((caller) =>
              caller.catchAll.map((proxy) => proxy.file),
            ),
          ).size,
        ),
        adapter.reasons.join(','),
      ];
    });
    const widths = censusLayoutStatics.tableHeader.map((title, column) =>
      Math.max(title.length, ...rows.map((row) => (row[column] ?? '').length)),
    );
    return [
      `${pkg.dir} (${pkg.name}): ${pkg.adapters.length} adapters`,
      `  ${censusTableLineTransformer({ cells: censusLayoutStatics.tableHeader, widths })}`,
      ...rows.map((row) => `  ${censusTableLineTransformer({ cells: row, widths })}`),
    ].join('\n');
  });

  const { totals } = census;
  const summary = `Totals: ${totals.adapters} adapters, ${totals.passThrough} pass-through, ${totals.logic} logic; ${totals.productionCallers} production callers; ${totals.composingProxies} composing proxies, ${totals.catchAllProxies} of them staging a catch-all.`;

  return processOutputContract.parse(`${heading}\n\n${blocks.join('\n\n')}\n\n${summary}\n`);
};
