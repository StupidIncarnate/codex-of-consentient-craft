/**
 * PURPOSE: Formats the dimensions of a completed `resize` step into a ContentText reading.
 * Reach for this over inline string interpolation so reading rendering stays encapsulated
 * and governed by resizeStatics.
 *
 * USAGE:
 * resizeReadingRenderTransformer({ width: 1280, height: 720 });
 * // Returns 'resized to 1280x720' as ContentText
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { resizeStatics } from '../../statics/resize/resize-statics';

export const resizeReadingRenderTransformer = ({
  width,
  height,
}: {
  width: number;
  height: number;
}): ContentText =>
  contentTextContract.parse(
    resizeStatics.template.replace('{width}', String(width)).replace('{height}', String(height)),
  );
