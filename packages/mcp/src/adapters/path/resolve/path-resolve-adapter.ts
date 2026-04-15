/**
 * PURPOSE: Adapter for path.resolve to resolve file paths
 *
 * USAGE:
 * const absolutePath = pathResolveAdapter({ paths: ['/base', 'relative', 'file.ts'] });
 * // Returns validated absolute PathSegment
 */
import { resolve } from 'path';
import { pathSegmentContract } from '@dungeonmaster/shared/contracts';
import type { PathSegment } from '@dungeonmaster/shared/contracts';

export const pathResolveAdapter = ({ paths }: { paths: string[] }): PathSegment =>
  pathSegmentContract.parse(resolve(...paths));
