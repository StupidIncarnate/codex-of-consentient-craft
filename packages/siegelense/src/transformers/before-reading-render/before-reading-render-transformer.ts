/**
 * PURPOSE: Formats the installed init script reading for a completed `before` step into a ContentText reading.
 * Reach for this over inline string interpolation so reading rendering stays encapsulated
 * and governed by beforeStatics.
 *
 * USAGE:
 * beforeReadingRenderTransformer({ source: 'console.log(1);' });
 * // Returns 'installed init script (15 chars)' as ContentText
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { beforeStatics } from '../../statics/before/before-statics';

export const beforeReadingRenderTransformer = ({ source }: { source: string }): ContentText =>
  contentTextContract.parse(beforeStatics.template.replace('{characters}', String(source.length)));
