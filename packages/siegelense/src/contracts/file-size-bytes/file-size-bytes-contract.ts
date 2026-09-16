/**
 * PURPOSE: A file's exact size in bytes, as `fs.stat` reports it. Reach for this over `Megabytes`
 * inside `fileStatContract`: a single file's size and a machine's whole-MB free-space reading answer
 * two different questions at two different precisions, and collapsing them onto one brand would let
 * a byte count and a megabyte count typecheck as interchangeable.
 *
 * USAGE:
 * fileSizeBytesContract.parse(2048);
 * // Returns a branded FileSizeBytes
 */

import { z } from 'zod';

export const fileSizeBytesContract = z.number().int().nonnegative().brand<'FileSizeBytes'>();

export type FileSizeBytes = z.infer<typeof fileSizeBytesContract>;
