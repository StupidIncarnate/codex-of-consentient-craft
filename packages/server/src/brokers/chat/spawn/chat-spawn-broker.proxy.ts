import { childProcessSpawnAdapterProxy } from '../../../adapters/child-process/spawn/child-process-spawn-adapter.proxy';
import { readlineCreateLineReaderAdapterProxy } from '../../../adapters/readline/create-line-reader/readline-create-line-reader-adapter.proxy';
import { processDevLogAdapterProxy } from '../../../adapters/process/dev-log/process-dev-log-adapter.proxy';
import { wsEventRelayBroadcastBrokerProxy } from '../../ws-event-relay/broadcast/ws-event-relay-broadcast-broker.proxy';

export const chatSpawnBrokerProxy = (): {
  setupSpawn: () => {
    emitLine: (params: { line: string }) => void;
    emitExit: (params: { code: number }) => void;
  };
} => {
  const spawnProxy = childProcessSpawnAdapterProxy();
  const readlineProxy = readlineCreateLineReaderAdapterProxy();
  processDevLogAdapterProxy();
  wsEventRelayBroadcastBrokerProxy();

  return {
    setupSpawn: (): {
      emitLine: (params: { line: string }) => void;
      emitExit: (params: { code: number }) => void;
    } => {
      const { processEmitter } = spawnProxy.setupSpawn();
      const { emitLine } = readlineProxy.setupLineReader();

      return {
        emitLine,
        emitExit: ({ code }: { code: number }): void => {
          processEmitter.emit('exit', code);
        },
      };
    },
  };
};
