/**
 * PURPOSE: Pass-through for the npm package 'fast-xml-parser'. Code outside the gateway imports fast-xml-parser
 * through here instead of the raw package, so a future guard or override on fast-xml-parser lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/fast-xml-parser';
 */

export * from 'fast-xml-parser';
