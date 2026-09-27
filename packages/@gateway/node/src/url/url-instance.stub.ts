/**
 * PURPOSE: A real `URL` instance, built through `#gateway/node/url`'s own re-exported `URL`
 * constructor — for a caller that needs a genuine parsed URL rather than a hand-typed one.
 *
 * USAGE:
 * const url = UrlInstanceStub({ href: 'https://example.com/path?x=1' });
 */
import { URL } from './url';

export const UrlInstanceStub = ({
  href = 'https://example.com/path?x=1',
}: { href?: string } = {}): URL => new URL(href);
