import { ModulePathStub } from '@dungeonmaster/shared/contracts/module-path/module-path.stub';
import { workspaceFolderBarrelProxyPathTransformer } from './workspace-folder-barrel-proxy-path-transformer';

describe('workspaceFolderBarrelProxyPathTransformer', () => {
  it('VALID: {brokers barrel, nested wrapper path} => joins them and appends .proxy', () => {
    const result = workspaceFolderBarrelProxyPathTransformer({
      importPath: ModulePathStub({ value: '@dungeonmaster/shared/brokers' }),
      relativeWrapperPath: ModulePathStub({
        value: 'project-root/find/project-root-find-broker',
      }),
    });

    expect(result).toBe(
      '@dungeonmaster/shared/brokers/project-root/find/project-root-find-broker.proxy',
    );
  });

  it('VALID: {startup barrel, single-level wrapper path} => joins them and appends .proxy', () => {
    const result = workspaceFolderBarrelProxyPathTransformer({
      importPath: ModulePathStub({ value: '@acme/orders/startup' }),
      relativeWrapperPath: ModulePathStub({ value: 'start-orders' }),
    });

    expect(result).toBe('@acme/orders/startup/start-orders.proxy');
  });
});
