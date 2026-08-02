import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questQaLedgerEntryContract } from './quest-qa-ledger-entry-contract';
import type { QuestQaLedgerEntry } from './quest-qa-ledger-entry-contract';

export const QuestQaLedgerEntryStub = ({
  ...props
}: StubArgument<QuestQaLedgerEntry> = {}): QuestQaLedgerEntry =>
  questQaLedgerEntryContract.parse({
    itemId: 'view-persisted-comments:observable:check-badge-count-text',
    disposition: 'walked',
    evidence: 'COMMENT_COUNT_BADGE rendered the string "2"',
    brokenWouldShow: 'would read "1" if the badge counted the node rather than the assertion card',
    observedBy: 'walker slice 3',
    rippleSites: [],
    workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
    createdAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });
