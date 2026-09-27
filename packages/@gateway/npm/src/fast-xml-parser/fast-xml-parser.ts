/**
 * PURPOSE: Gateway entry for the npm package 'fast-xml-parser'. Every raw export passes through;
 * `parseXml` is OUR guarded parse — a new name because its shape (fixed options, validated,
 * wraps its own thrown errors) is not the raw `new XMLParser().parse()` call it replaces.
 *
 * USAGE:
 * import { parseXml } from '#gateway/npm/fast-xml-parser';
 */

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
export { parseXml } from './parse-xml/parse-xml';
