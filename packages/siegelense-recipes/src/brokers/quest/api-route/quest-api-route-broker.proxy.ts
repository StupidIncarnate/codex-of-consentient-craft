import { dmHttpRequestAdapterProxy } from '../../../adapters/dm-http/request/dm-http-request-adapter.proxy';
import type { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';

type DmHttpResponse = ReturnType<typeof DmHttpResponseStub>;

export const questApiRouteBrokerProxy = (): {
  succeeds: ({ url, response }: { url: string; response: DmHttpResponse }) => void;
} => {
  const httpProxy = dmHttpRequestAdapterProxy();

  return {
    succeeds: ({ url, response }: { url: string; response: DmHttpResponse }): void => {
      httpProxy.succeeds({ url, response });
    },
  };
};
