import { gatewaySubpathHasWrapperLayerBroker } from './gateway-subpath-has-wrapper-layer-broker';
import { gatewaySubpathHasWrapperLayerBrokerProxy } from './gateway-subpath-has-wrapper-layer-broker.proxy';

describe('gatewaySubpathHasWrapperLayerBroker', () => {
  it('EMPTY: {barrel and its test only} => returns false', () => {
    const proxy = gatewaySubpathHasWrapperLayerBrokerProxy();
    const subpathDirectory = '/repo/packages/@gateway/npm/src/left-pad/';
    proxy.fsReaddirSync.returns({
      path: subpathDirectory,
      entries: [
        { name: 'left-pad.ts', kind: 'file' },
        { name: 'left-pad.test.ts', kind: 'file' },
      ],
    });

    expect(
      gatewaySubpathHasWrapperLayerBroker({ subpathDirectory, barrelFileName: 'left-pad.ts' }),
    ).toBe(false);
  });

  it('EMPTY: {only proxy, stub, d.ts, harness and error companions beside the barrel} => returns false', () => {
    const proxy = gatewaySubpathHasWrapperLayerBrokerProxy();
    const subpathDirectory = '/repo/packages/@gateway/npm/src/left-pad/';
    proxy.fsReaddirSync.returns({
      path: subpathDirectory,
      entries: [
        { name: 'left-pad.ts', kind: 'file' },
        { name: 'left-pad.proxy.ts', kind: 'file' },
        { name: 'left-pad.stub.ts', kind: 'file' },
        { name: 'left-pad.d.ts', kind: 'file' },
        { name: 'left-pad.harness.ts', kind: 'file' },
        { name: 'left-pad-failed.error.ts', kind: 'file' },
      ],
    });

    expect(
      gatewaySubpathHasWrapperLayerBroker({ subpathDirectory, barrelFileName: 'left-pad.ts' }),
    ).toBe(false);
  });

  it('VALID: {wrapper folder holding a single-dot .ts} => returns true', () => {
    const proxy = gatewaySubpathHasWrapperLayerBrokerProxy();
    const subpathDirectory = '/repo/packages/@gateway/node/src/os/';
    const wrapperDirectory = '/repo/packages/@gateway/node/src/os/homedir/';
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
        { name: 'homedir.test.ts', kind: 'file' },
      ],
    });

    expect(gatewaySubpathHasWrapperLayerBroker({ subpathDirectory, barrelFileName: 'os.ts' })).toBe(
      true,
    );
  });

  it('VALID: {nested file sharing the barrel name} => returns true', () => {
    const proxy = gatewaySubpathHasWrapperLayerBrokerProxy();
    const subpathDirectory = '/repo/packages/@gateway/npm/src/glob/';
    const wrapperDirectory = '/repo/packages/@gateway/npm/src/glob/glob/';
    proxy.fsReaddirSync.returns({
      path: subpathDirectory,
      entries: [
        { name: 'glob', kind: 'directory' },
        { name: 'glob.ts', kind: 'file' },
      ],
    });
    proxy.fsReaddirSync.returns({
      path: wrapperDirectory,
      entries: [{ name: 'glob.ts', kind: 'file' }],
    });

    expect(
      gatewaySubpathHasWrapperLayerBroker({ subpathDirectory, barrelFileName: 'glob.ts' }),
    ).toBe(true);
  });
});
