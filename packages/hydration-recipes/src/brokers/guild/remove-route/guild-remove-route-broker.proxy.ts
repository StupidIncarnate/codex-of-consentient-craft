import { guildRemoveBroker } from '@dungeonmaster/orchestrator/brokers';
import { guildRemoveBrokerProxy } from '@dungeonmaster/orchestrator/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { dmHttpRequestAdapterProxy } from '../../../adapters/dm-http/request/dm-http-request-adapter.proxy';
import { dmHttpResponseUnwrapAdapterProxy } from '../../../adapters/dm-http/response-unwrap/dm-http-response-unwrap-adapter.proxy';

export const guildRemoveRouteBrokerProxy = (): {
  succeeds: ({ guildId }: { guildId: string }) => void;
} => {
  // guildRemoveBrokerProxy's own setup is fs-config-shaped and does not let a test stage an
  // arbitrary resolved value directly — created here only to satisfy
  // `enforce-proxy-child-creation`; this route's own registerMock below stages the real answer.
  guildRemoveBrokerProxy();
  const removeGuildHandle = registerMock({ fn: guildRemoveBroker });
  // dmHttpRequestAdapter's own branching (target.request vs global fetch) is exercised in the
  // HTTP-branch tests via a plain `target.request` closure — the same technique
  // `dm-http-request-adapter.test.ts` uses at the adapter's own level, which lets a test assert the
  // exact method/path/guildId sent without a fetch mock to address. Created here only to satisfy
  // `enforce-proxy-child-creation`.
  dmHttpRequestAdapterProxy();
  dmHttpResponseUnwrapAdapterProxy();

  return {
    succeeds: ({ guildId }: { guildId: string }): void => {
      removeGuildHandle.calledWith([{ guildId }]).resolves({ success: true });
    },
  };
};
