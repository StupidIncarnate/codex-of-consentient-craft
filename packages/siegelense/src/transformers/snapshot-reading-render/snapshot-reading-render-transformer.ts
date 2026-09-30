/**
 * PURPOSE: Formats the recorded snapshot name of a completed `snapshot` step into a ContentText reading.
 * Reach for this over inline string interpolation so reading rendering stays encapsulated
 * and governed by snapshotStatics.
 *
 * USAGE:
 * snapshotReadingRenderTransformer({ name: 'clean' });
 * // Returns 'snapshot "clean" recorded' as ContentText
 */

import { snapshotStatics } from '../../statics/snapshot/snapshot-statics';

export const snapshotReadingRenderTransformer = ({ name }: { name: string }): string =>
  snapshotStatics.template.replace('{name}', name);
