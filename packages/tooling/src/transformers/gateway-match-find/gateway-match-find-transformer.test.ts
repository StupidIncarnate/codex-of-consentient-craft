import { gatewayMatchFindTransformer } from './gateway-match-find-transformer';
import { GatewayImplementationStub } from '../../contracts/gateway-implementation/gateway-implementation.stub';
import { OutsideCallStub } from '../../contracts/outside-call/outside-call.stub';

describe('gatewayMatchFindTransformer', () => {
  const readFile = GatewayImplementationStub();
  const statIfExists = GatewayImplementationStub({
    name: 'statIfExists' as never,
    outsideCalls: [OutsideCallStub({ name: 'stat' as never })],
  });

  it('VALID: {a call to fs/promises readFile} => the exact gateway export', () => {
    const result = gatewayMatchFindTransformer({
      outsideCalls: [OutsideCallStub()],
      implementations: [readFile, statIfExists],
    });

    expect(result).toStrictEqual([
      { importPath: '#gateway/node/fs__promises', name: 'readFile', match: 'exact' },
    ]);
  });

  it('VALID: {a call to fs/promises stat} => a related wrapper that calls stat', () => {
    const result = gatewayMatchFindTransformer({
      outsideCalls: [OutsideCallStub({ name: 'stat' as never })],
      implementations: [readFile, statIfExists],
    });

    expect(result).toStrictEqual([
      { importPath: '#gateway/node/fs__promises', name: 'statIfExists', match: 'related' },
    ]);
  });

  it('VALID: {an exact and a related match} => exact lists first', () => {
    const stat = GatewayImplementationStub({
      name: 'stat' as never,
      outsideCalls: [OutsideCallStub({ name: 'stat' as never })],
    });

    const result = gatewayMatchFindTransformer({
      outsideCalls: [OutsideCallStub({ name: 'stat' as never })],
      implementations: [statIfExists, stat],
    });

    expect(result).toStrictEqual([
      { importPath: '#gateway/node/fs__promises', name: 'stat', match: 'exact' },
      { importPath: '#gateway/node/fs__promises', name: 'statIfExists', match: 'related' },
    ]);
  });

  it('VALID: {a call already made through #gateway} => that export, exact', () => {
    const result = gatewayMatchFindTransformer({
      outsideCalls: [
        OutsideCallStub({
          module: '#gateway/node/fs__promises' as never,
          name: 'readFile' as never,
        }),
      ],
      implementations: [],
    });

    expect(result).toStrictEqual([
      { importPath: '#gateway/node/fs__promises', name: 'readFile', match: 'exact' },
    ]);
  });

  it('VALID: {a node: prefixed module} => matches the same gateway folder', () => {
    const result = gatewayMatchFindTransformer({
      outsideCalls: [OutsideCallStub({ module: 'node:fs/promises' as never })],
      implementations: [readFile],
    });

    expect(result).toStrictEqual([
      { importPath: '#gateway/node/fs__promises', name: 'readFile', match: 'exact' },
    ]);
  });

  it('EMPTY: {a call into a module the gateway does not wrap} => no match', () => {
    const result = gatewayMatchFindTransformer({
      outsideCalls: [OutsideCallStub({ module: 'left-pad' as never, name: 'pad' as never })],
      implementations: [readFile, statIfExists],
    });

    expect(result).toStrictEqual([]);
  });

  it('EMPTY: {no outside calls} => no match', () => {
    const result = gatewayMatchFindTransformer({
      outsideCalls: [],
      implementations: [readFile],
    });

    expect(result).toStrictEqual([]);
  });
});
