import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';
import { gatewaySubpathHasStubLayerBroker } from './gateway-subpath-has-stub-layer-broker';
import { gatewaySubpathHasStubLayerBrokerProxy } from './gateway-subpath-has-stub-layer-broker.proxy';

describe('gatewaySubpathHasStubLayerBroker', () => {
  it('VALID: {subpath with a .stub.ts directly inside it} => returns true', () => {
    const proxy = gatewaySubpathHasStubLayerBrokerProxy();
    const subpathDirectory = FilePathStub({
      value: '/repo/packages/@gateway/node/src/setTimeout/',
    });
    proxy.fsReaddirSync.returns({
      dirPath: subpathDirectory,
      entries: [
        { name: FileNameStub({ value: 'setTimeout.ts' }), isDirectory: false },
        { name: FileNameStub({ value: 'setTimeout.test.ts' }), isDirectory: false },
        { name: FileNameStub({ value: 'timeout.stub.ts' }), isDirectory: false },
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
      dirPath: subpathDirectory,
      entries: [
        { name: FileNameStub({ value: 'is-fs-error' }), isDirectory: true },
        { name: FileNameStub({ value: 'fs.ts' }), isDirectory: false },
      ],
    });
    proxy.fsReaddirSync.returns({
      dirPath: wrapperDirectory,
      entries: [
        { name: FileNameStub({ value: 'fs-error.ts' }), isDirectory: false },
        { name: FileNameStub({ value: 'fs-error.stub.ts' }), isDirectory: false },
        { name: FileNameStub({ value: 'is-fs-error.ts' }), isDirectory: false },
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
      dirPath: subpathDirectory,
      entries: [
        { name: FileNameStub({ value: 'homedir' }), isDirectory: true },
        { name: FileNameStub({ value: 'os.ts' }), isDirectory: false },
      ],
    });
    proxy.fsReaddirSync.returns({
      dirPath: wrapperDirectory,
      entries: [
        { name: FileNameStub({ value: 'homedir.ts' }), isDirectory: false },
        { name: FileNameStub({ value: 'homedir.proxy.ts' }), isDirectory: false },
        { name: FileNameStub({ value: 'homedir.test.ts' }), isDirectory: false },
      ],
    });

    expect(gatewaySubpathHasStubLayerBroker({ subpathDirectory })).toBe(false);
  });
});
