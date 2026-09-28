import { guildDirectoryEnsureBrokerProxy } from '../directory-ensure/guild-directory-ensure-broker.proxy';
import { guildUniquePathResolveBrokerProxy } from '../unique-path-resolve/guild-unique-path-resolve-broker.proxy';
import { dmHttpRequestBrokerProxy } from '../../dm/http-request/dm-http-request-broker.proxy';
import type { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';

type DmHttpResponse = ReturnType<typeof DmHttpResponseStub>;

export const guildApiRouteBrokerProxy = (): {
  succeeds: ({ url, response }: { url: string; response: DmHttpResponse }) => void;
  pathsTouched: () => readonly unknown[];
} => {
  const httpProxy = dmHttpRequestBrokerProxy();
  const directoryProxy = guildDirectoryEnsureBrokerProxy();
  // guildUniquePathResolveBrokerProxy's own default leaves every scenario's default fragment
  // untouched — every existing test here never stages a collision.
  guildUniquePathResolveBrokerProxy();

  return {
    succeeds: ({ url, response }: { url: string; response: DmHttpResponse }): void => {
      httpProxy.succeeds({ url, response });
    },
    pathsTouched: (): readonly unknown[] => directoryProxy.pathsTouched(),
  };
};
