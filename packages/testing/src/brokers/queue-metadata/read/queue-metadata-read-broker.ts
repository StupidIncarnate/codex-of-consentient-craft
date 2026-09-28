/**
 * PURPOSE: Reads a mock harness's queue `metadata.json` back off disk and holds it to the
 * QueueMetadata shape, so a spec asserting how many queued responses the fake CLI consumed reads a
 * validated counter instead of raw JSON. Reach for it from a harness; any other JSON file is read
 * with the fs gateway directly.
 *
 * USAGE:
 * const { counter } = queueMetadataReadBroker({ metadataPath: '/tmp/queue/metadata.json' });
 * // Returns the validated QueueMetadata; throws when the file is missing, is not JSON, or has no
 * // non-negative integer counter
 */

import { readJsonFileSync } from '#gateway/node/fs';

import { queueMetadataContract } from '../../../contracts/queue-metadata/queue-metadata-contract';
import type { QueueMetadata } from '../../../contracts/queue-metadata/queue-metadata-contract';

export const queueMetadataReadBroker = ({
  metadataPath,
}: {
  metadataPath: string;
}): QueueMetadata => queueMetadataContract.parse(readJsonFileSync(metadataPath));
