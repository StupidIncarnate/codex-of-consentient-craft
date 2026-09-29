/**
 * PURPOSE: A real `Request`, built through the real constructor — for a caller that hands a
 * request to a handler and needs the genuine url, method and body accessors.
 *
 * USAGE:
 * const request = RequestStub({ url: 'http://localhost/api/guilds', method: 'POST', body: '{}' });
 */
import { Request } from './Request';

export const RequestStub = ({
  url = 'http://localhost/api/test',
  method = 'GET',
  body,
}: { url?: string; method?: string; body?: string } = {}): Request =>
  new Request(url, { method, ...(body === undefined ? {} : { body }) });
