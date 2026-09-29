import { IdentifierStub as IdentifierNodeStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { MemberExpressionStub } from '#gateway/npm/typescript-eslint__utils/member-expression/member-expression.stub';
import { IdentifierStub } from '@dungeonmaster/shared/contracts/identifier/identifier.stub';
import { isStatusMemberExpressionLayerBrokerProxy } from './is-status-member-expression-layer-broker.proxy';

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
          node: IdentifierNodeStub({ code: 'x;' }),
          extraAllowlist: [],
        }),
      ).toBe(false);
    });
  });

  describe('MemberExpression with non-status property', () => {
    it('EMPTY: {quest.name} => returns false', () => {
      const proxy = isStatusMemberExpressionLayerBrokerProxy();

      const node = MemberExpressionStub({ code: 'quest.name;' });

      expect(proxy.isStatusMemberExpressionLayerBroker({ node, extraAllowlist: [] })).toBe(false);
    });
  });

  describe('MemberExpression.status on default holders', () => {
    it.each(['quest', 'workItem', 'wi', 'item', 'input', 'postResult'] as const)(
      'VALID: {%s.status} => returns true',
      (holder) => {
        const proxy = isStatusMemberExpressionLayerBrokerProxy();

        const node = MemberExpressionStub({ code: `${holder}.status;` });

        expect(proxy.isStatusMemberExpressionLayerBroker({ node, extraAllowlist: [] })).toBe(true);
      },
    );
  });

  describe('MemberExpression.status on identifiers matching /Quest$|Item$/', () => {
    it.each(['someQuest', 'myItem', 'PendingItem'] as const)(
      'VALID: {%s.status} => returns true',
      (holder) => {
        const proxy = isStatusMemberExpressionLayerBrokerProxy();

        const node = MemberExpressionStub({ code: `${holder}.status;` });

        expect(proxy.isStatusMemberExpressionLayerBroker({ node, extraAllowlist: [] })).toBe(true);
      },
    );
  });

  describe('Dotted holder (postResult.quest.status)', () => {
    it('VALID: {postResult.quest.status} => returns true', () => {
      const proxy = isStatusMemberExpressionLayerBrokerProxy();

      const node = MemberExpressionStub({ code: 'postResult.quest.status;' });

      expect(proxy.isStatusMemberExpressionLayerBroker({ node, extraAllowlist: [] })).toBe(true);
    });
  });

  describe('non-allowlisted holder', () => {
    it('EMPTY: {user.status} => returns false', () => {
      const proxy = isStatusMemberExpressionLayerBrokerProxy();

      const node = MemberExpressionStub({ code: 'user.status;' });

      expect(proxy.isStatusMemberExpressionLayerBroker({ node, extraAllowlist: [] })).toBe(false);
    });

    it('VALID: {user.status, extraAllowlist: ["user"]} => returns true', () => {
      const proxy = isStatusMemberExpressionLayerBrokerProxy();

      const node = MemberExpressionStub({ code: 'user.status;' });

      expect(
        proxy.isStatusMemberExpressionLayerBroker({
          node,
          extraAllowlist: [IdentifierStub({ value: 'user' })],
        }),
      ).toBe(true);
    });
  });
});
