/**
 * PURPOSE: Gateway entry for the npm package 'fast-xml-parser'. Every raw export passes through;
 * `parseXml` is OUR guarded parse — a new name because its shape (fixed options, validated,
 * wraps its own thrown errors) is not the raw `new XMLParser().parse()` call it replaces.
 *
 * USAGE:
 * import { parseXml } from '@dungeonmaster/npm/fast-xml-parser';
 */

// Named, not `export *`: under `node16` a CommonJS file reads the package's `.d.cts`, which is
// `export = fxp`, and `export *` cannot re-export from an `export =` module (TS2498).
export { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser';
export type {
  ESchema,
  X2jOptions,
  XMLMetaData,
  ValidationError,
  XmlBuilderOptions,
  strnumOptions,
  validationOptions,
} from 'fast-xml-parser';
export { parseXml } from './parse-xml';
