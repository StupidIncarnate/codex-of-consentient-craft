/**
 * PURPOSE: Turns a DomReading into ContentText JSON so a session reading `results --step N`
 * sees the extracted DOM nodes, counts, and cap warning notes.
 *
 * USAGE:
 * domReadingRenderTransformer({ reading: DomReadingStub() });
 * // Returns '{"count":1,"showing":1,"capped":false,"note":null,"nodes":[...]}'
 */

import type { DomReading } from '../../contracts/dom-reading/dom-reading-contract';

export const domReadingRenderTransformer = ({ reading }: { reading: DomReading }): string =>
  JSON.stringify(reading);
