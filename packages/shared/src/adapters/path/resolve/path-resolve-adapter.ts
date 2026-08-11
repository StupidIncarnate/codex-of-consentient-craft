/**
 * PURPOSE: Anchors a possibly-relative path onto a base so it can be handed to something that only
 * accepts an absolute one — the on-disk package detectors, chiefly. Reach for this over
 * pathJoinAdapter when the RESULT must be absolute whatever came in: join concatenates and preserves
 * relativity, so a repo-relative `./packages/web` stays relative and fails absoluteFilePathContract,
 * and it also normalises the leading `./` away. Lead with the base directory whenever the caller
 * knows one — a single segment falls back to the process working directory, which is the wrong root
 * for anything describing a repo other than the one this process runs in.
 *
 * USAGE:
 * pathResolveAdapter({ paths: ['/home/me/repo', './packages/web'] });
 * // Returns '/home/me/repo/packages/web'
 */

import { resolve } from 'path';

import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const pathResolveAdapter = ({ paths }: { paths: string[] }): AbsoluteFilePath =>
  absoluteFilePathContract.parse(resolve(...paths));
