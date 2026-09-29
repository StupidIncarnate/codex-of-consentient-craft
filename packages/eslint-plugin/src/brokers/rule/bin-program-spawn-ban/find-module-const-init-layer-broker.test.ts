import { LiteralStub } from '#gateway/npm/typescript-eslint__utils/literal/literal.stub';
import { VariableDeclarationStub } from '#gateway/npm/typescript-eslint__utils/variable-declaration/variable-declaration.stub';
import { findModuleConstInitLayerBroker } from './find-module-const-init-layer-broker';
import { findModuleConstInitLayerBrokerProxy } from './find-module-const-init-layer-broker.proxy';

describe('findModuleConstInitLayerBroker', () => {
  describe('matching const', () => {
    it('VALID: {name: "COMMAND", moduleBody: [const COMMAND = "git"]} => returns the init node', () => {
      findModuleConstInitLayerBrokerProxy();
      const code = 'const COMMAND = "git";';
      const initNode = LiteralStub({ code });
      const moduleBody = [VariableDeclarationStub({ code })];

      const result = findModuleConstInitLayerBroker({ name: 'COMMAND', moduleBody });

      expect(result).toStrictEqual(initNode);
    });
  });

  describe('no matching const', () => {
    it('EMPTY: {name: "COMMAND", moduleBody: []} => returns undefined', () => {
      findModuleConstInitLayerBrokerProxy();

      expect(findModuleConstInitLayerBroker({ name: 'COMMAND', moduleBody: [] })).toBe(undefined);
    });

    it('INVALID: {name: "COMMAND", moduleBody: [let COMMAND = "git"]} => returns undefined, not a const', () => {
      findModuleConstInitLayerBrokerProxy();
      const moduleBody = [VariableDeclarationStub({ code: 'let COMMAND = "git";' })];

      expect(findModuleConstInitLayerBroker({ name: 'COMMAND', moduleBody })).toBe(undefined);
    });

    it('INVALID: {name: "OTHER", moduleBody: [const COMMAND = "git"]} => returns undefined, name mismatch', () => {
      findModuleConstInitLayerBrokerProxy();
      const moduleBody = [VariableDeclarationStub({ code: 'const COMMAND = "git";' })];

      expect(findModuleConstInitLayerBroker({ name: 'OTHER', moduleBody })).toBe(undefined);
    });
  });
});
