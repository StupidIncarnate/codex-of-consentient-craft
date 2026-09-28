import { guildDirectoryEnsureBrokerProxy } from '../directory-ensure/guild-directory-ensure-broker.proxy';
import { guildUniquePathResolveBrokerProxy } from '../unique-path-resolve/guild-unique-path-resolve-broker.proxy';
import { dmHttpRequestBrokerProxy } from '../../dm/http-request/dm-http-request-broker.proxy';
import type { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';

type DmHttpResponse = ReturnType<typeof DmHttpResponseStub>;

export const guildApiRouteBrokerProxy = (): {
  succeeds: ({ url, response }: { url: string; response: DmHttpResponse }) => void;
  setupDirectoryCreation: ({ path }: { path: string }) => void;
  setupPathFree: ({ path }: { path: string }) => void;
  pathsTouched: () => readonly unknown[];
} => {
  const httpProxy = dmHttpRequestBrokerProxy();
  const directoryProxy = guildDirectoryEnsureBrokerProxy();
  const uniquePathProxy = guildUniquePathResolveBrokerProxy();

  return {
    succeeds: ({ url, response }: { url: string; response: DmHttpResponse }): void => {
      httpProxy.succeeds({ url, response });
    },
    setupDirectoryCreation: ({ path }: { path: string }): void => {
      directoryProxy.setupDirectoryCreation({ path });
    },
    setupPathFree: ({ path }: { path: string }): void => {
      uniquePathProxy.setupFree({ absolutePaths: [path] });
    },
    pathsTouched: (): readonly unknown[] => directoryProxy.pathsTouched(),
  };
};
