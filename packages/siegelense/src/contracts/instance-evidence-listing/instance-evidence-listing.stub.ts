import type { StubArgument } from '@dungeonmaster/shared/@types';

import { instanceEvidenceListingContract } from './instance-evidence-listing-contract';
import type { InstanceEvidenceListing } from './instance-evidence-listing-contract';

export const InstanceEvidenceListingStub = ({
  ...props
}: StubArgument<InstanceEvidenceListing> = {}): InstanceEvidenceListing =>
  instanceEvidenceListingContract.parse({
    dir: {
      path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c',
      linkPresent: true,
    },
    files: [
      {
        path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c/api-server.log',
        bytes: 2048,
      },
    ],
    ...props,
  });
