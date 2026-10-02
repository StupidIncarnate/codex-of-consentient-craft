import { resolveGatewayFunctionNamesLayerBroker } from './resolve-gateway-function-names-layer-broker';
import { resolveGatewayFunctionNamesLayerBrokerProxy } from './resolve-gateway-function-names-layer-broker.proxy';
import { childProcessFunctionNamesStatics } from '../../../statics/child-process-function-names/child-process-function-names-statics';

describe('resolveGatewayFunctionNamesLayerBroker', () => {
  it('VALID: {fileDir: "/"} => returns default gateway functions when no workspace root found', () => {
    const proxy = resolveGatewayFunctionNamesLayerBrokerProxy();
    proxy.setupNoWorkspaceRoot({ fileDir: '/' });

    const result = resolveGatewayFunctionNamesLayerBroker({ fileDir: '/' });

    expect(result).toStrictEqual([...childProcessFunctionNamesStatics.gatewayFunctionNames]);
  });

  it('VALID: {fileDir: "/", extraWrapperFunctions: [spawnFireAndForget]} => returns default and extra functions', () => {
    const proxy = resolveGatewayFunctionNamesLayerBrokerProxy();
    proxy.setupNoWorkspaceRoot({ fileDir: '/' });

    const result = resolveGatewayFunctionNamesLayerBroker({
      fileDir: '/',
      extraWrapperFunctions: ['spawnFireAndForget'],
    });

    expect(result).toStrictEqual([
      ...childProcessFunctionNamesStatics.gatewayFunctionNames,
      'spawnFireAndForget',
    ]);
  });

  it('VALID: {fileDir: rootDir with missing barrel} => returns default gateway functions', () => {
    const proxy = resolveGatewayFunctionNamesLayerBrokerProxy();
    proxy.setupMissingBarrel({ rootDir: '/repo-missing' });

    const result = resolveGatewayFunctionNamesLayerBroker({
      fileDir: '/repo-missing',
    });

    expect(result).toStrictEqual([...childProcessFunctionNamesStatics.gatewayFunctionNames]);
  });

  it('VALID: {fileDir: rootDir with barrel containing extra wrappers, schemas, and errors} => detects wrappers and filters out non-wrapper exports', () => {
    const proxy = resolveGatewayFunctionNamesLayerBrokerProxy();
    const barrelContent = [
      "export * from 'child_process';",
      "export { run } from './run/run';",
      "export { spawnFireAndForget } from './spawn-fire-and-forget/spawn-fire-and-forget';",
      "export { RunNotFoundError } from './run-not-found.error';",
      "export { childProcessSchema } from './child-process/child-process-schema';",
      "export { customProcessContract } from './custom-process/custom-process-contract';",
    ].join('\n');

    proxy.setupWorkspaceBarrel({ rootDir: '/repo-custom', barrelContent });

    const result = resolveGatewayFunctionNamesLayerBroker({
      fileDir: '/repo-custom',
    });

    expect(result).toStrictEqual([
      ...childProcessFunctionNamesStatics.gatewayFunctionNames,
      'spawnFireAndForget',
    ]);
  });

  it('VALID: {fileDir: same directory called twice} => uses cached detected functions', () => {
    const proxy = resolveGatewayFunctionNamesLayerBrokerProxy();
    const barrelContent = [
      "export { spawnFireAndForget } from './spawn-fire-and-forget/spawn-fire-and-forget';",
    ].join('\n');

    proxy.setupWorkspaceBarrel({ rootDir: '/repo-cached', barrelContent });

    const firstResult = resolveGatewayFunctionNamesLayerBroker({
      fileDir: '/repo-cached',
    });
    const secondResult = resolveGatewayFunctionNamesLayerBroker({
      fileDir: '/repo-cached',
    });

    expect(firstResult).toStrictEqual([
      ...childProcessFunctionNamesStatics.gatewayFunctionNames,
      'spawnFireAndForget',
    ]);
    expect(secondResult).toStrictEqual(firstResult);
  });
});
