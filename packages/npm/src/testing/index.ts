/**
 * PURPOSE: Caller-facing proxy surface for @dungeonmaster/npm's wrapped modules. Every wrapped
 * (non-pass-through) module exports its `.proxy.ts` here, so a caller mocking one of our gateway
 * overrides imports it from this one subpath rather than reaching into the wrapper's own folder.
 *
 * USAGE:
 * import { globProxy, renderProxy, parseXmlProxy, decodePngProxy } from '@dungeonmaster/npm/testing';
 */
export { globProxy } from '../glob/glob.proxy';
export { renderProxy } from '../@testing-library/react/render.proxy';
export { parseXmlProxy } from '../fast-xml-parser/parse-xml.proxy';
export { decodePngProxy } from '../pngjs/decode-png.proxy';
