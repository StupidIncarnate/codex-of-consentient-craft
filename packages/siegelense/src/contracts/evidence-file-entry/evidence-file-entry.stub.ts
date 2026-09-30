import type { StubArgument } from '@dungeonmaster/shared/@types';

import { evidenceFileEntryContract } from './evidence-file-entry-contract';
import type { EvidenceFileEntry } from './evidence-file-entry-contract';

export const EvidenceFileEntryStub = ({
  ...props
}: StubArgument<EvidenceFileEntry> = {}): EvidenceFileEntry =>
  evidenceFileEntryContract.parse({
    path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c/api-server.log',
    bytes: 2048,
    ...props,
  });
