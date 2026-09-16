/**
 * PURPOSE: Reads free/total memory, core count and load average straight from `os` — the four
 * fields of a `status` answer's machine block that need no `/proc` parsing of their own (siegelense-
 * tooling.md line 1171). Reach for this over reading `os.freemem`/`os.totalmem`/`os.cpus`/`os.loadavg`
 * again at a call site: every caller of `status` shares this one conversion from bytes to whole
 * megabytes.
 *
 * USAGE:
 * osInfoAdapter();
 * // Returns { freeMemMB, totalMemMB, cores, loadAvg }
 */

import { cpus, freemem, loadavg, totalmem } from 'os';
import { loadAverageContract } from '../../../contracts/load-average/load-average-contract';
import type { LoadAverage } from '../../../contracts/load-average/load-average-contract';
import { megabytesContract } from '../../../contracts/megabytes/megabytes-contract';
import type { Megabytes } from '../../../contracts/megabytes/megabytes-contract';
import { readingCountContract } from '../../../contracts/reading-count/reading-count-contract';
import type { ReadingCount } from '../../../contracts/reading-count/reading-count-contract';
import { machineStatics } from '../../../statics/machine/machine-statics';

export const osInfoAdapter = (): {
  freeMemMB: Megabytes;
  totalMemMB: Megabytes;
  cores: ReadingCount;
  loadAvg: LoadAverage;
} => {
  const { bytesPerMegabyte } = machineStatics.units;

  return {
    freeMemMB: megabytesContract.parse(Math.floor(freemem() / bytesPerMegabyte)),
    totalMemMB: megabytesContract.parse(Math.floor(totalmem() / bytesPerMegabyte)),
    cores: readingCountContract.parse(cpus().length),
    loadAvg: loadAverageContract.parse(loadavg()),
  };
};
