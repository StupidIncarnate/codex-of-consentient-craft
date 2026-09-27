/**
 * PURPOSE: A real formatted string, produced by actually calling `#gateway/node/util`'s own
 * re-exported `format()` — for a caller that needs a genuine formatted message rather than a
 * hand-typed one.
 *
 * USAGE:
 * const text = FormattedTextStub({ template: '%s is %d', args: ['foo', 42] });
 * // Returns 'foo is 42'
 */
import { format } from './util';

export const FormattedTextStub = ({
  template = '%s is %d',
  args = ['foo', 42],
}: { template?: string; args?: unknown[] } = {}): string => format(template, ...args);
