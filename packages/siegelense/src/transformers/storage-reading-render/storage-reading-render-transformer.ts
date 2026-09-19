/**
 * PURPOSE: Turns a StorageReading into ContentText JSON so a session reading step results
 * sees the page's localStorage and sessionStorage state.
 *
 * USAGE:
 * storageReadingRenderTransformer({ reading: StorageReadingStub() });
 * // Returns '{"origin":"http://localhost:3000","local":{},"session":{}}'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { StorageReading } from '../../contracts/storage-reading/storage-reading-contract';

export const storageReadingRenderTransformer = ({
  reading,
}: {
  reading: StorageReading;
}): ContentText => contentTextContract.parse(JSON.stringify(reading));
