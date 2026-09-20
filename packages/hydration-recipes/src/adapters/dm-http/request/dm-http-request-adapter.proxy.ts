import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import type { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';

type DmHttpResponse = ReturnType<typeof DmHttpResponseStub>;

export const dmHttpRequestAdapterProxy = (): {
  succeeds: ({ url, response }: { url: string; response: DmHttpResponse }) => void;
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'fetch' });

  return {
    succeeds: ({ url, response }: { url: string; response: DmHttpResponse }): void => {
      handle.calledWith([url]).resolves({
        status: response.status,
        json: async (): Promise<unknown> => Promise.resolve(response.body),
      } as never);
    },
  };
};
