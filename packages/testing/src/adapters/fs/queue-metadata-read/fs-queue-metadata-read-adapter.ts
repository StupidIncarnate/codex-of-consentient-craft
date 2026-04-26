/**
 * PURPOSE: Reads and validates the queue metadata.json file that mock harnesses use to persist the queue counter
 *
 * USAGE:
 * const metadata = fsQueueMetadataReadAdapter({ metadataPath: '/tmp/queue/metadata.json' });
 * // Returns validated QueueMetadata with the counter field
 *
 * WHEN-TO-USE: When a test harness needs to read back the current queue counter from disk
 * WHEN-NOT-TO-USE: When reading arbitrary JSON files — use fsReadFileAdapter for that
 */

import { readFileSync } from 'fs';

import { queueMetadataContract } from '../../../contracts/queue-metadata/queue-metadata-contract';
import type { QueueMetadata } from '../../../contracts/queue-metadata/queue-metadata-contract';

export const fsQueueMetadataReadAdapter = ({
  metadataPath,
}: {
  metadataPath: string;
}): QueueMetadata => queueMetadataContract.parse(JSON.parse(readFileSync(metadataPath, 'utf-8')));
