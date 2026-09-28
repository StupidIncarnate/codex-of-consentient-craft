import { guildDirectoryEnsureBrokerProxy } from '../directory-ensure/guild-directory-ensure-broker.proxy';
import { dmHttpRequestAdapterProxy } from '../../../adapters/dm-http/request/dm-http-request-adapter.proxy';
import { dmHttpResponseUnwrapAdapterProxy } from '../../../adapters/dm-http/response-unwrap/dm-http-response-unwrap-adapter.proxy';
import type { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';

type DmHttpResponse = ReturnType<typeof DmHttpResponseStub>;

export const guildApiRouteBrokerProxy = (): {
  succeeds: ({ url, response }: { url: string; response: DmHttpResponse }) => void;
  pathsTouched: () => readonly unknown[];
} => {
  const httpProxy = dmHttpRequestAdapterProxy();
  dmHttpResponseUnwrapAdapterProxy();
  const directoryProxy = guildDirectoryEnsureBrokerProxy();

  return {
    succeeds: ({ url, response }: { url: string; response: DmHttpResponse }): void => {
      httpProxy.succeeds({ url, response });
    },
    pathsTouched: (): readonly unknown[] => directoryProxy.pathsTouched(),
  };
};
