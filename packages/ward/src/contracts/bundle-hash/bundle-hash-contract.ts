/**
 * PURPOSE: The identity of one prebuilt e2e bundle, derived from everything that went into it.
 * Reach for this rather than RunId wherever a value NAMES A DIRECTORY THAT MAY BE REUSED: a RunId
 * is unique per invocation, so a bundle keyed by one is rebuilt every run and never shared, which
 * is the whole cost this bundle exists to remove.
 *
 * USAGE:
 * bundleHashContract.parse('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
 * // Returns a lowercase-hex string of bundleStatics.hashLength characters
 */

import { z } from '#gateway/npm/zod';

import { bundleStatics } from '../../statics/bundle/bundle-statics';

export const bundleHashContract = z
  .string()
  .length(bundleStatics.hashLength)
  .regex(/^[a-f0-9]+$/u, 'Invalid BundleHash format: expected lowercase hex');

export type BundleHash = z.infer<typeof bundleHashContract>;
