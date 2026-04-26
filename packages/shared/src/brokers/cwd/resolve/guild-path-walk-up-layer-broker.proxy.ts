import { fsAccessAdapterProxy } from '../../../adapters/fs/access/fs-access-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';

export const guildPathWalkUpLayerBrokerProxy = (): {
  setupGuildFoundAtStart: (params: { startPath: string }) => void;
  setupGuildFoundInParent: (params: { startPath: string; guildPath: string }) => void;
  setupGuildNotFound: (params: { startPath: string }) => void;
} => {
  const fsAccessProxy = fsAccessAdapterProxy();
  const pathDirnameProxy = pathDirnameAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupGuildFoundAtStart: ({ startPath }: { startPath: string }): void => {
      pathJoinProxy.returns({ result: `${startPath}/guild.json` as never });
      fsAccessProxy.resolves();
    },

    setupGuildFoundInParent: ({
      startPath,
      guildPath,
    }: {
      startPath: string;
      guildPath: string;
    }): void => {
      pathJoinProxy.returns({ result: `${startPath}/guild.json` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT') });
      pathDirnameProxy.returns({ result: guildPath as never });
      pathJoinProxy.returns({ result: `${guildPath}/guild.json` as never });
      fsAccessProxy.resolves();
    },

    setupGuildNotFound: ({ startPath }: { startPath: string }): void => {
      pathJoinProxy.returns({ result: `${startPath}/guild.json` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT') });
      pathDirnameProxy.returns({ result: startPath as never });
    },
  };
};
