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
    transcript: 'run_2.jsonl',
    logs: ['api-server.log', 'web-server.log'],
    lastShot: 'run_2/step7.png',
    ...props,
  });
