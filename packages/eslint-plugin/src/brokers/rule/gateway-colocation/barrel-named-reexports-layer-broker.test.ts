import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';
import { barrelNamedReexportsLayerBroker } from './barrel-named-reexports-layer-broker';
import { barrelNamedReexportsLayerBrokerProxy } from './barrel-named-reexports-layer-broker.proxy';

describe('barrelNamedReexportsLayerBroker', () => {
  it('VALID: {one named re-export with a source} => returns its name and source', () => {
    barrelNamedReexportsLayerBrokerProxy();
    const node = ProgramStub({
      code: 'export { readFileSync } from "./read-file-sync/read-file-sync";',
    });

    const result = barrelNamedReexportsLayerBroker({ node });

    expect(result).toStrictEqual([
      { name: 'readFileSync', source: './read-file-sync/read-file-sync' },
    ]);
  });

  it('VALID: {renamed re-export} => returns the exported-as name, not the local name', () => {
    barrelNamedReexportsLayerBrokerProxy();
    const node = ProgramStub({ code: 'export { internalName as readFile } from "./internal";' });

    const result = barrelNamedReexportsLayerBroker({ node });

    expect(result).toStrictEqual([{ name: 'readFile', source: './internal' }]);
  });

  it('EMPTY: {export * from a bare specifier, no specifiers} => returns an empty array', () => {
    barrelNamedReexportsLayerBrokerProxy();
    const node = ProgramStub({ code: "export * from 'x';" });

    const result = barrelNamedReexportsLayerBroker({ node });

    expect(result).toStrictEqual([]);
  });

  it('EMPTY: {a named export with no source} => returns an empty array', () => {
    barrelNamedReexportsLayerBrokerProxy();
    const node = ProgramStub({ code: 'export const x;' });

    const result = barrelNamedReexportsLayerBroker({ node });

    expect(result).toStrictEqual([]);
  });
});
