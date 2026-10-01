import { fetchWithStatusProxy } from '#gateway/node/fetch/fetch-with-status/fetch-with-status.proxy';
import type { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';

type DmHttpResponse = ReturnType<typeof DmHttpResponseStub>;

export const dmHttpRequestBrokerProxy = (): {
  succeeds: ({ url, response }: { url: string; response: DmHttpResponse }) => void;
  fails: ({ url, cause }: { url: string; cause: Error }) => void;
} => {
  const fetchProxy = fetchWithStatusProxy();

  return {
    succeeds: ({ url, response }: { url: string; response: DmHttpResponse }): void => {
      fetchProxy.setupResponse({
        url,
        status: response.status,
        bodyText: JSON.stringify(response.body),
      });
    },
    fails: ({ url, cause }: { url: string; cause: Error }): void => {
      fetchProxy.setupRefused({ url, cause });
    },
  };
};
