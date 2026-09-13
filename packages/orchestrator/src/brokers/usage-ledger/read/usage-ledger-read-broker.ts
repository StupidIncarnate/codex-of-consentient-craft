/**
 * PURPOSE: Reads the persisted usage ledger. A missing or unparseable file resolves to the empty
 *   ledger rather than throwing, because the poller that calls this runs every few seconds and a
 *   throw there would kill the only thing able to lift a hold.
 *
 * USAGE:
 * const ledger = await usageLedgerReadBroker();
 * // Returns UsageLedger — the empty one when nothing has been measured yet
 */

import type { UsageLedger } from '@dungeonmaster/shared/contracts';
import { filePathContract, usageLedgerContract } from '@dungeonmaster/shared/contracts';
import { locationsUsageLedgerPathFindBroker } from '@dungeonmaster/shared/brokers';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { usageLedgerDefaultStatics } from '../../../statics/usage-ledger-default/usage-ledger-default-statics';

export const usageLedgerReadBroker = async (): Promise<UsageLedger> => {
  const ledgerPath = locationsUsageLedgerPathFindBroker();

  try {
    const contents = await fsReadFileAdapter({ filePath: filePathContract.parse(ledgerPath) });
    return usageLedgerContract.parse(JSON.parse(contents));
  } catch {
    // Missing on a first run, or unparseable after an interrupted write. Either way the next scan
    // rebuilds it from the transcripts, which are the real source.
    return usageLedgerContract.parse(usageLedgerDefaultStatics.empty);
  }
};
