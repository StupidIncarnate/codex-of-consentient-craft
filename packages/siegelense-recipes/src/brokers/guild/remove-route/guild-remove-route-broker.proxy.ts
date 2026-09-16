import { guildRemoveBroker } from '@dungeonmaster/orchestrator/brokers';
import { guildRemoveBrokerProxy } from '@dungeonmaster/orchestrator/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const guildRemoveRouteBrokerProxy = (): {
  succeeds: ({ guildId }: { guildId: string }) => void;
} => {
  // guildRemoveBrokerProxy's own setup is fs-config-shaped and does not let a test stage an
  // arbitrary resolved value directly — created here only to satisfy
  // `enforce-proxy-child-creation`; this route's own registerMock below stages the real answer.
  guildRemoveBrokerProxy();
  const removeGuildHandle = registerMock({ fn: guildRemoveBroker });

  return {
    succeeds: ({ guildId }: { guildId: string }): void => {
      removeGuildHandle.calledWith([{ guildId }]).resolves({ success: true });
    },
  };
};
