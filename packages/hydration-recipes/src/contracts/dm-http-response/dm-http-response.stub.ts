/**
 * PURPOSE: Builds a valid `DmHttpResponse` for a test that needs one but does not care about
 * the exact status or body — defaults to a 200 with an empty object body.
 *
 * USAGE:
 * DmHttpResponseStub({ status: 201, body: { id: 'f47ac10b-...' } });
 * // Returns DmHttpResponse
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { dmHttpResponseContract } from './dm-http-response-contract';
import type { DmHttpResponse } from './dm-http-response-contract';

export const DmHttpResponseStub = ({
  ...props
}: StubArgument<DmHttpResponse> = {}): DmHttpResponse =>
  dmHttpResponseContract.parse({
    status: 200,
    body: {},
    ...props,
  });
