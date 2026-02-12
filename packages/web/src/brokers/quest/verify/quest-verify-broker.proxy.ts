import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';
import type { QuestVerifyResult } from '../../../contracts/quest-verify-result/quest-verify-result-contract';

export const questVerifyBrokerProxy = (): {
  setupVerify: (params: { result: QuestVerifyResult }) => void;
  setupError: (params: { error: Error }) => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  const fetchProxy = fetchPostAdapterProxy();

  return {
    setupVerify: ({ result }: { result: QuestVerifyResult }): void => {
      fetchProxy.resolves({ data: result });
    },
    setupError: ({ error }: { error: Error }): void => {
      fetchProxy.rejects({ error });
    },
    setupInvalidResponse: ({ data }: { data: unknown }): void => {
      fetchProxy.resolves({ data });
    },
  };
};
