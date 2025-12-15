import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { projectRootFindBrokerProxy } from '../../project-root/find/project-root-find-broker.proxy';

export const questsFolderFindBrokerProxy = (): {
  projectRootProxy: ReturnType<typeof projectRootFindBrokerProxy>;
  pathJoinProxy: ReturnType<typeof pathJoinAdapterProxy>;
} => {
  const projectRootProxy = projectRootFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    projectRootProxy,
    pathJoinProxy,
  };
};
