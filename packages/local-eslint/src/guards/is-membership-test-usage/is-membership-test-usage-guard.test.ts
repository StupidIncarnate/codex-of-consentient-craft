import { TsestreeStub, TsestreeNodeType } from '@dungeonmaster/eslint-plugin';

import { packageNameLiteralStatics } from '../../statics/package-name-literal/package-name-literal-statics';
import { isMembershipTestUsageGuard } from './is-membership-test-usage-guard';

describe('isMembershipTestUsageGuard', () => {
  describe('missing node', () => {
    it('EMPTY: {} => returns false', () => {
      expect(isMembershipTestUsageGuard({})).toBe(false);
    });

    it('EMPTY: {node: null} => returns false', () => {
      expect(isMembershipTestUsageGuard({ node: null })).toBe(false);
    });

    it('EMPTY: {node: ArrayExpression with no parent} => returns false', () => {
      expect(
        isMembershipTestUsageGuard({
          node: TsestreeStub({ type: TsestreeNodeType.ArrayExpression, parent: null }),
        }),
      ).toBe(false);
    });
  });

  describe('membership test methods', () => {
    it.each(packageNameLiteralStatics.membershipTestMethodNames)(
      'VALID: {node: receiver of .%s()} => returns true',
      (methodName) => {
        expect(
          isMembershipTestUsageGuard({
            node: TsestreeStub({
              type: TsestreeNodeType.ArrayExpression,
              parent: {
                type: TsestreeNodeType.MemberExpression,
                property: { type: TsestreeNodeType.Identifier, name: methodName },
              },
            }),
          }),
        ).toBe(true);
      },
    );

    it('VALID: {node: binding identifier receiving .includes()} => returns true', () => {
      expect(
        isMembershipTestUsageGuard({
          node: TsestreeStub({
            type: TsestreeNodeType.Identifier,
            name: 'UI_PACKAGES',
            parent: {
              type: TsestreeNodeType.MemberExpression,
              property: { type: TsestreeNodeType.Identifier, name: 'includes' },
            },
          }),
        }),
      ).toBe(true);
    });

    it("VALID: {node: computed member ['includes']} => returns true, since the bracket spelling is the same call", () => {
      expect(
        isMembershipTestUsageGuard({
          node: TsestreeStub({
            type: TsestreeNodeType.ArrayExpression,
            parent: {
              type: TsestreeNodeType.MemberExpression,
              property: { type: TsestreeNodeType.Literal, value: 'includes' },
            },
          }),
        }),
      ).toBe(true);
    });

    it('VALID: {node: the property identifier itself} => returns false, because the method name is not the collection', () => {
      expect(
        isMembershipTestUsageGuard({
          node: TsestreeStub({
            type: TsestreeNodeType.Identifier,
            name: 'includes',
            parent: {
              type: TsestreeNodeType.MemberExpression,
              property: { type: TsestreeNodeType.Identifier, name: 'includes' },
            },
          }),
        }),
      ).toBe(false);
    });

    it('VALID: {node: receiver of .map()} => returns false, because reshaping a list decides nothing', () => {
      expect(
        isMembershipTestUsageGuard({
          node: TsestreeStub({
            type: TsestreeNodeType.ArrayExpression,
            parent: {
              type: TsestreeNodeType.MemberExpression,
              property: { type: TsestreeNodeType.Identifier, name: 'map' },
            },
          }),
        }),
      ).toBe(false);
    });

    it('VALID: {node: receiver of .filter()} => returns false, because narrowing a list decides nothing', () => {
      expect(
        isMembershipTestUsageGuard({
          node: TsestreeStub({
            type: TsestreeNodeType.ArrayExpression,
            parent: {
              type: TsestreeNodeType.MemberExpression,
              property: { type: TsestreeNodeType.Identifier, name: 'filter' },
            },
          }),
        }),
      ).toBe(false);
    });

    it.each(['some', 'every', 'find', 'findIndex'])(
      'VALID: {node: receiver of .%s()} => returns false, because a callback can ask anything',
      (methodName) => {
        expect(
          isMembershipTestUsageGuard({
            node: TsestreeStub({
              type: TsestreeNodeType.ArrayExpression,
              parent: {
                type: TsestreeNodeType.MemberExpression,
                property: { type: TsestreeNodeType.Identifier, name: methodName },
              },
            }),
          }),
        ).toBe(false);
      },
    );
  });

  describe('membership set construction', () => {
    it('VALID: {node: argument of new Set()} => returns true', () => {
      expect(
        isMembershipTestUsageGuard({
          node: TsestreeStub({
            type: TsestreeNodeType.ArrayExpression,
            parent: {
              type: TsestreeNodeType.NewExpression,
              callee: { type: TsestreeNodeType.Identifier, name: 'Set' },
            },
          }),
        }),
      ).toBe(true);
    });

    it('VALID: {node: argument of new Map()} => returns false, since a Map built from names is a lookup, not a test', () => {
      expect(
        isMembershipTestUsageGuard({
          node: TsestreeStub({
            type: TsestreeNodeType.ArrayExpression,
            parent: {
              type: TsestreeNodeType.NewExpression,
              callee: { type: TsestreeNodeType.Identifier, name: 'Map' },
            },
          }),
        }),
      ).toBe(false);
    });

    it('VALID: {node: the Set callee identifier itself} => returns false', () => {
      expect(
        isMembershipTestUsageGuard({
          node: TsestreeStub({
            type: TsestreeNodeType.Identifier,
            name: 'Set',
            parent: {
              type: TsestreeNodeType.NewExpression,
              callee: { type: TsestreeNodeType.Identifier, name: 'Set' },
            },
          }),
        }),
      ).toBe(false);
    });
  });

  describe('type-assertion wrappers', () => {
    it('VALID: {node: `as const` array reaching .includes()} => returns true through the assertion', () => {
      expect(
        isMembershipTestUsageGuard({
          node: TsestreeStub({
            type: TsestreeNodeType.ArrayExpression,
            parent: {
              type: TsestreeNodeType.TSAsExpression,
              parent: {
                type: TsestreeNodeType.MemberExpression,
                property: { type: TsestreeNodeType.Identifier, name: 'includes' },
              },
            },
          }),
        }),
      ).toBe(true);
    });
  });

  describe('data positions', () => {
    it('VALID: {node: initializer of a VariableDeclarator} => returns false on its own', () => {
      expect(
        isMembershipTestUsageGuard({
          node: TsestreeStub({
            type: TsestreeNodeType.ArrayExpression,
            parent: { type: TsestreeNodeType.VariableDeclarator },
          }),
        }),
      ).toBe(false);
    });

    it('VALID: {node: value of an object Property} => returns false', () => {
      expect(
        isMembershipTestUsageGuard({
          node: TsestreeStub({
            type: TsestreeNodeType.ArrayExpression,
            parent: { type: TsestreeNodeType.Property },
          }),
        }),
      ).toBe(false);
    });
  });
});
