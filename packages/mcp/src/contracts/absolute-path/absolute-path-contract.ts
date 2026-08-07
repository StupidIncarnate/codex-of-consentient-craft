/**
 * PURPOSE: Marks the base directory a glob resolves against, so `fsGlobAdapter`'s `cwd` cannot be
 * confused at the type level with its `pattern` or with the `PathSegment` results it hands back.
 * The brand is a domain marker only and carries no runtime guarantee, so reach for shared's
 * `absoluteFilePathContract` whenever a value has to genuinely BE absolute, and for
 * `pathSegmentContract` for the bare repo-relative `filepath` the other `adapters/fs/*` take.
 *
 * USAGE:
 * const cwd = absolutePathContract.parse('/home/user/project');
 * // Returns a branded AbsolutePath
 */
import { z } from 'zod';

export const absolutePathContract = z.string().brand<'AbsolutePath'>();

export type AbsolutePath = z.infer<typeof absolutePathContract>;
