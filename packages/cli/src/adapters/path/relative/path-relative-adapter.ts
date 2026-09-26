/**
 * PURPOSE: Computes the relative path from one directory to another using Node's own `path.relative`
 * — the one gateway-install computation this repo has no shared adapter for yet (`@dungeonmaster/shared/adapters`
 * ships join/dirname/resolve/basename but not relative). Reach for this whenever a tsconfig `paths`
 * entry has to point from a consumer package's own directory at `packages/@gateway/<folder>`.
 *
 * USAGE:
 * pathRelativeAdapter({ from: FilePathStub({value: '/repo/packages/app'}), to: FilePathStub({value: '/repo/packages/@gateway/npm'}) });
 * // Returns PathSegment branded type: '../@gateway/npm'
 */

import { relative } from 'path';
import {
  pathSegmentContract,
  type FilePath,
  type PathSegment,
} from '@dungeonmaster/shared/contracts';

export const pathRelativeAdapter = ({ from, to }: { from: FilePath; to: FilePath }): PathSegment =>
  pathSegmentContract.parse(relative(from, to));
