/**
 * PURPOSE: Adapter for path.join to join file path segments
 *
 * USAGE:
 * const joinedPath = pathJoinAdapter({ paths: ['/base', 'folder', 'file.ts'] });
 * // Returns validated PathSegment
 */
import { join } from 'path';
import { pathSegmentContract } from '@dungeonmaster/shared/contracts';
import type { PathSegment } from '@dungeonmaster/shared/contracts';

export const pathJoinAdapter = ({ paths }: { paths: readonly string[] }): PathSegment =>
  pathSegmentContract.parse(join(...paths));
