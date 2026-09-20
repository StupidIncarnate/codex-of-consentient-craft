import type { StubArgument } from '@dungeonmaster/shared/@types';
import { httpResponseContract } from './http-response-contract';
import type { HttpResponse } from './http-response-contract';

export const HttpResponseStub = ({ ...props }: StubArgument<HttpResponse> = {}): HttpResponse =>
  httpResponseContract.parse({
    url: 'http://localhost:3737/api/guilds',
    status: 200,
    body: '{"id":"g1"}',
    ...props,
  });
