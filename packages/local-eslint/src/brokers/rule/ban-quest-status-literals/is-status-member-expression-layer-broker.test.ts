import { IdentifierStub } from '@dungeonmaster/shared/contracts';
import { isStatusMemberExpressionLayerBrokerProxy } from './is-status-member-expression-layer-broker.proxy';
import { TsestreeStub, TsestreeNodeType } from '@dungeonmaster/eslint-plugin';

describe('isStatusMemberExpressionLayerBroker', () => {
  describe('missing node', () => {
    it('EMPTY: {node: null} => returns false', () => {
      const proxy = isStatusMemberExpressionLayerBrokerProxy();

      expect(proxy.isStatusMemberExpressionLayerBroker({ node: null, extraAllowlist: [] })).toBe(
        false,
      );
    });

    it('EMPTY: {node omitted} => returns false', () => {
      const proxy = isStatusMemberExpressionLayerBrokerProxy();

      expect(
        proxy.isStatusMemberExpressionLayerBroker({
          extraAllowlist: [],
        }),
      ).toBe(false);
    });
  });

  describe('non-MemberExpression node', () => {
    it('EMPTY: {node: Identifier} => returns false', () => {
      const proxy = isStatusMemberExpressionLayerBrokerProxy();

      expect(
        proxy.isStatusMemberExpressionLayerBroker({
          node: TsestreeStub({ type: TsestreeNodeType.Identifier }),
          extraAllowlist: [],
        }),
      ).toBe(false);
    });
  });

  describe('MemberExpression with non-status property', () => {
    it('EMPTY: {quest.name} => returns false', () => {
      const proxy = isStatusMemberExpressionLayerBrokerProxy();

      const node = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: IdentifierStub({ value: 'quest' }),
        }),
        property: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: IdentifierStub({ value: 'name' }),
        }),
      });

      expect(proxy.isStatusMemberExpressionLayerBroker({ node, extraAllowlist: [] })).toBe(false);
    });
  });

  describe('MemberExpression.status on default holders', () => {
    it.each(['quest', 'workItem', 'wi', 'item', 'input', 'postResult'] as const)(
      'VALID: {%s.status} => returns true',
      (holder) => {
        const proxy = isStatusMemberExpressionLayerBrokerProxy();

        const node = TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({
            type: TsestreeNodeType.Identifier,
            name: IdentifierStub({ value: holder }),
          }),
          property: TsestreeStub({
            type: TsestreeNodeType.Identifier,
            name: IdentifierStub({ value: 'status' }),
          }),
        });

        expect(proxy.isStatusMemberExpressionLayerBroker({ node, extraAllowlist: [] })).toBe(true);
      },
    );
  });

  describe('MemberExpression.status on identifiers matching /Quest$|Item$/', () => {
    it.each(['someQuest', 'myItem', 'PendingItem'] as const)(
      'VALID: {%s.status} => returns true',
      (holder) => {
        const proxy = isStatusMemberExpressionLayerBrokerProxy();

        const node = TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({
            type: TsestreeNodeType.Identifier,
            name: IdentifierStub({ value: holder }),
          }),
          property: TsestreeStub({
            type: TsestreeNodeType.Identifier,
            name: IdentifierStub({ value: 'status' }),
          }),
        });

        expect(proxy.isStatusMemberExpressionLayerBroker({ node, extraAllowlist: [] })).toBe(true);
      },
    );
  });

  describe('Dotted holder (postResult.quest.status)', () => {
    it('VALID: {postResult.quest.status} => returns true', () => {
      const proxy = isStatusMemberExpressionLayerBrokerProxy();

      const node = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({
            type: TsestreeNodeType.Identifier,
            name: IdentifierStub({ value: 'postResult' }),
          }),
          property: TsestreeStub({
            type: TsestreeNodeType.Identifier,
            name: IdentifierStub({ value: 'quest' }),
          }),
        }),
        property: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: IdentifierStub({ value: 'status' }),
        }),
      });

      expect(proxy.isStatusMemberExpressionLayerBroker({ node, extraAllowlist: [] })).toBe(true);
    });
  });

  describe('non-allowlisted holder', () => {
    it('EMPTY: {user.status} => returns false', () => {
      const proxy = isStatusMemberExpressionLayerBrokerProxy();

      const node = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: IdentifierStub({ value: 'user' }),
        }),
        property: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: IdentifierStub({ value: 'status' }),
        }),
      });

      expect(proxy.isStatusMemberExpressionLayerBroker({ node, extraAllowlist: [] })).toBe(false);
    });

    it('VALID: {user.status, extraAllowlist: ["user"]} => returns true', () => {
      const proxy = isStatusMemberExpressionLayerBrokerProxy();

      const node = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: IdentifierStub({ value: 'user' }),
        }),
        property: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: IdentifierStub({ value: 'status' }),
        }),
      });

      expect(
        proxy.isStatusMemberExpressionLayerBroker({
          node,
          extraAllowlist: [IdentifierStub({ value: 'user' })],
        }),
      ).toBe(true);
    });
  });
});
