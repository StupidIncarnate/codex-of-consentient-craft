import { gatewayMatchFindTransformer } from './gateway-match-find-transformer';
import { GatewayImplementationStub } from '../../contracts/gateway-implementation/gateway-implementation.stub';
import { OutsideCallStub } from '../../contracts/outside-call/outside-call.stub';

describe('gatewayMatchFindTransformer', () => {
  const readFile = GatewayImplementationStub();
  const statIfExists = GatewayImplementationStub({
    name: 'statIfExists',
    outsideCalls: [OutsideCallStub({ name: 'stat' })],
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
      outsideCalls: [OutsideCallStub({ name: 'stat' })],
      implementations: [readFile, statIfExists],
    });

    expect(result).toStrictEqual([
      { importPath: '#gateway/node/fs__promises', name: 'statIfExists', match: 'related' },
    ]);
  });

  it('VALID: {an exact and a related match} => exact lists first', () => {
    const stat = GatewayImplementationStub({
      name: 'stat',
      outsideCalls: [OutsideCallStub({ name: 'stat' })],
    });

    const result = gatewayMatchFindTransformer({
      outsideCalls: [OutsideCallStub({ name: 'stat' })],
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
          module: '#gateway/node/fs__promises',
          name: 'readFile',
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
      outsideCalls: [OutsideCallStub({ module: 'node:fs/promises' })],
      implementations: [readFile],
    });

    expect(result).toStrictEqual([
      { importPath: '#gateway/node/fs__promises', name: 'readFile', match: 'exact' },
    ]);
  });

  it('EMPTY: {a call into a module the gateway does not wrap} => no match', () => {
    const result = gatewayMatchFindTransformer({
      outsideCalls: [OutsideCallStub({ module: 'left-pad', name: 'pad' })],
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
