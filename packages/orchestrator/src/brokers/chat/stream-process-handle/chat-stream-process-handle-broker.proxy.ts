import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { randomUUID } from '#gateway/node/crypto';
import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/brokers/claude-line/normalize/claude-line-normalize-broker.proxy';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { questGetServerConfigBrokerProxy } from '../../quest/get-server-config/quest-get-server-config-broker.proxy';
import { chatSubagentTailBrokerProxy } from '../subagent-tail/chat-subagent-tail-broker.proxy';

export const chatStreamProcessHandleBrokerProxy = (): {
  setupSubagentHomeDir: (params: { homeDir: string }) => void;
  setupSubagentLines: (params: { path: string; lines: readonly string[] }) => void;
  triggerSubagentChange: (params: { path: string }) => void;
  setupUuids: (params: {
    uuids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
  setupTimestamps: (params: { timestamps: readonly string[] }) => void;
  setPort: (params: { value: string }) => void;
} => {
  stderrProxy();
  claudeLineNormalizeBrokerProxy();
  const subagentTailProxy = chatSubagentTailBrokerProxy();
  // The broker now resolves the server's bound port to build the pasted-image rewrite
  // base URL. Stage a default HERE, in the constructor, before any test runs — without
  // it DUNGEONMASTER_PORT is unset, portResolveBroker falls through to processCwdAdapter()
  // and an fs walk for .dungeonmaster.json, and this suite's fs mock throws on unmatched
  // calls, turning every existing test in the file red.
  const serverConfigProxy = questGetServerConfigBrokerProxy();
  serverConfigProxy.setPort({ value: '3737' });

  const uuidMock: SpyOnHandle = registerMock({ fn: randomUUID });
  const dateMock: SpyOnHandle = registerSpyOn({ object: Date.prototype, method: 'toISOString' });

  return {
    setupSubagentHomeDir: ({ homeDir }: { homeDir: string }): void => {
      subagentTailProxy.setupHomeDir({ homeDir });
    },
    setupSubagentLines: ({ path, lines }: { path: string; lines: readonly string[] }): void => {
      subagentTailProxy.setupLines({ path, lines });
    },
    triggerSubagentChange: ({ path }: { path: string }): void => {
      subagentTailProxy.triggerChange({ path });
    },
    setupUuids: ({
      uuids,
    }: {
      uuids: readonly `${string}-${string}-${string}-${string}-${string}`[];
    }): void => {
      // randomUUID takes no arguments — [] is the honest address. Each call queues a
      // one-shot answer consumed in registration order, same as the mockReturnValueOnce chain
      // this replaces.
      for (const uuid of uuids) {
        uuidMock.onceFor([]).returns(uuid);
      }
    },
    setupTimestamps: ({ timestamps }: { timestamps: readonly string[] }): void => {
      // Date.prototype.toISOString's address would be the receiver `this`, which a spy cannot
      // see — [] is the honest address.
      for (const timestamp of timestamps) {
        dateMock.onceFor([]).returns(timestamp);
      }
    },
    setPort: serverConfigProxy.setPort,
  };
};
