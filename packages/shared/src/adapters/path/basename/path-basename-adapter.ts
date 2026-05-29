/**
 * PURPOSE: Gets the final path segment (basename) from a file path using Node.js path module
 *
 * USAGE:
 * import {pathBasenameAdapter} from './path-basename-adapter';
 * const folderName = pathBasenameAdapter({path: filePathContract.parse('/home/user/projects/my-app')});
 * // Returns PathSegment branded type: 'my-app'
 */

import { basename } from 'path';
import { pathSegmentContract } from '../../../contracts/path-segment/path-segment-contract';
import type { PathSegment } from '../../../contracts/path-segment/path-segment-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathBasenameAdapter = ({ path }: { path: FilePath }): PathSegment =>
  pathSegmentContract.parse(basename(path));
