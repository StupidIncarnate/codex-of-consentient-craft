/**
 * PURPOSE: Formats the recorded snapshot name of a completed `snapshot` step into a ContentText reading.
 * Reach for this over inline string interpolation so reading rendering stays encapsulated
 * and governed by snapshotStatics.
 *
 * USAGE:
 * snapshotReadingRenderTransformer({ name: SnapshotNameStub({ value: 'clean' }) });
 * // Returns 'snapshot "clean" recorded' as ContentText
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { SnapshotName } from '../../contracts/snapshot-name/snapshot-name-contract';
import { snapshotStatics } from '../../statics/snapshot/snapshot-statics';

export const snapshotReadingRenderTransformer = ({ name }: { name: SnapshotName }): ContentText =>
  contentTextContract.parse(snapshotStatics.template.replace('{name}', String(name)));
