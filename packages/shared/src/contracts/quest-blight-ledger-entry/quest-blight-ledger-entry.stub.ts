import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questBlightLedgerEntryContract } from './quest-blight-ledger-entry-contract';
import type { QuestBlightLedgerEntry } from './quest-blight-ledger-entry-contract';

export const QuestBlightLedgerEntryStub = ({
  ...props
}: StubArgument<QuestBlightLedgerEntry> = {}): QuestBlightLedgerEntry =>
  questBlightLedgerEntryContract.parse({
    itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft',
    disposition: 'reviewed',
    evidence: 'handleSubmit rethrows the network error with the request url attached',
    observedBy: 'blightwarden',
    rippleSites: [],
    workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
    createdAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });
