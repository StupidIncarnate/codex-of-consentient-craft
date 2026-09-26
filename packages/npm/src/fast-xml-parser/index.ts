/**
 * PURPOSE: Gateway entry for the npm package 'fast-xml-parser'. Every raw export passes through;
 * `parseXml` is OUR guarded parse — a new name because its shape (fixed options, validated,
 * wraps its own thrown errors) is not the raw `new XMLParser().parse()` call it replaces.
 *
 * USAGE:
 * import { parseXml } from '@dungeonmaster/npm/fast-xml-parser';
 */

export * from 'fast-xml-parser';
export { parseXml } from './parse-xml';
