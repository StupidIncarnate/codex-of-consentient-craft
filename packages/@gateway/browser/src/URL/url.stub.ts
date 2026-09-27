/**
 * PURPOSE: A real `URL` instance, built through the real constructor — for a caller staging
 * `#gateway/browser/URL`'s own value without hand-typing a fake one.
 *
 * USAGE:
 * const url = UrlStub({ href: 'https://example.com/path?query=1' });
 */
import { URL } from './URL';

export const UrlStub = ({
  href = 'https://example.com/path?query=1',
}: { href?: string } = {}): URL => new URL(href);
