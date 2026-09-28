import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { gatewaySubpathHasStubLayerBroker } from './gateway-subpath-has-stub-layer-broker';
import { gatewaySubpathHasStubLayerBrokerProxy } from './gateway-subpath-has-stub-layer-broker.proxy';

describe('gatewaySubpathHasStubLayerBroker', () => {
  it('VALID: {subpath with a .stub.ts directly inside it} => returns true', () => {
    const proxy = gatewaySubpathHasStubLayerBrokerProxy();
    const subpathDirectory = FilePathStub({
      value: '/repo/packages/@gateway/node/src/setTimeout/',
    });
    proxy.fsReaddirSync.returns({
      path: subpathDirectory,
      entries: [
        { name: 'setTimeout.ts', kind: 'file' },
        { name: 'setTimeout.test.ts', kind: 'file' },
        { name: 'timeout.stub.ts', kind: 'file' },
      ],
    });

    expect(gatewaySubpathHasStubLayerBroker({ subpathDirectory })).toBe(true);
  });

  it('VALID: {subpath with a .stub.ts nested two folders deep} => returns true', () => {
    const proxy = gatewaySubpathHasStubLayerBrokerProxy();
    const subpathDirectory = FilePathStub({ value: '/repo/packages/@gateway/node/src/fs/' });
    const wrapperDirectory = FilePathStub({
      value: '/repo/packages/@gateway/node/src/fs/is-fs-error/',
    });
    proxy.fsReaddirSync.returns({
      path: subpathDirectory,
      entries: [
        { name: 'is-fs-error', kind: 'directory' },
        { name: 'fs.ts', kind: 'file' },
      ],
    });
    proxy.fsReaddirSync.returns({
      path: wrapperDirectory,
      entries: [
        { name: 'fs-error.ts', kind: 'file' },
        { name: 'fs-error.stub.ts', kind: 'file' },
        { name: 'is-fs-error.ts', kind: 'file' },
      ],
    });

    expect(gatewaySubpathHasStubLayerBroker({ subpathDirectory })).toBe(true);
  });

  it('EMPTY: {subpath with wrapper folders but no .stub.ts anywhere} => returns false', () => {
    const proxy = gatewaySubpathHasStubLayerBrokerProxy();
    const subpathDirectory = FilePathStub({ value: '/repo/packages/@gateway/node/src/os/' });
    const wrapperDirectory = FilePathStub({
      value: '/repo/packages/@gateway/node/src/os/homedir/',
    });
    proxy.fsReaddirSync.returns({
      path: subpathDirectory,
      entries: [
        { name: 'homedir', kind: 'directory' },
        { name: 'os.ts', kind: 'file' },
      ],
    });
    proxy.fsReaddirSync.returns({
      path: wrapperDirectory,
      entries: [
        { name: 'homedir.ts', kind: 'file' },
        { name: 'homedir.proxy.ts', kind: 'file' },
        { name: 'homedir.test.ts', kind: 'file' },
      ],
    });

    expect(gatewaySubpathHasStubLayerBroker({ subpathDirectory })).toBe(false);
  });
});
