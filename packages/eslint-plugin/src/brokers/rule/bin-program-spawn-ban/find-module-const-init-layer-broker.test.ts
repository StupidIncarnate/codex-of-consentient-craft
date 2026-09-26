import { findModuleConstInitLayerBroker } from './find-module-const-init-layer-broker';
import { findModuleConstInitLayerBrokerProxy } from './find-module-const-init-layer-broker.proxy';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('findModuleConstInitLayerBroker', () => {
  describe('matching const', () => {
    it('VALID: {name: "COMMAND", moduleBody: [const COMMAND = "git"]} => returns the init node', () => {
      findModuleConstInitLayerBrokerProxy();
      const initNode = TsestreeStub({ type: TsestreeNodeType.Literal, value: 'git' });
      const moduleBody = [
        TsestreeStub({
          type: TsestreeNodeType.VariableDeclaration,
          kind: 'const',
          declarations: [
            TsestreeStub({
              type: TsestreeNodeType.VariableDeclarator,
              id: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'COMMAND' }),
              init: initNode,
            }),
          ],
        }),
      ];

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
      const moduleBody = [
        TsestreeStub({
          type: TsestreeNodeType.VariableDeclaration,
          kind: 'let',
          declarations: [
            TsestreeStub({
              type: TsestreeNodeType.VariableDeclarator,
              id: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'COMMAND' }),
              init: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'git' }),
            }),
          ],
        }),
      ];

      expect(findModuleConstInitLayerBroker({ name: 'COMMAND', moduleBody })).toBe(undefined);
    });

    it('INVALID: {name: "OTHER", moduleBody: [const COMMAND = "git"]} => returns undefined, name mismatch', () => {
      findModuleConstInitLayerBrokerProxy();
      const moduleBody = [
        TsestreeStub({
          type: TsestreeNodeType.VariableDeclaration,
          kind: 'const',
          declarations: [
            TsestreeStub({
              type: TsestreeNodeType.VariableDeclarator,
              id: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'COMMAND' }),
              init: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'git' }),
            }),
          ],
        }),
      ];

      expect(findModuleConstInitLayerBroker({ name: 'OTHER', moduleBody })).toBe(undefined);
    });
  });
});
