import type { StubArgument } from '@dungeonmaster/shared/@types';

import { httpRequestReadingContract } from './http-request-reading-contract';
import type { HttpRequestReading } from './http-request-reading-contract';

export const HttpRequestReadingStub = ({
  ...props
}: StubArgument<HttpRequestReading> = {}): HttpRequestReading =>
  httpRequestReadingContract.parse({
    status: 200,
    statusText: 'OK',
    headers: {},
    body: {},
    ...props,
  });
