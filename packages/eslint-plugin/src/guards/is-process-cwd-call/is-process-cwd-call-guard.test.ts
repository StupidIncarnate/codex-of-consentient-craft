import { isProcessCwdCallGuard } from './is-process-cwd-call-guard';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';
import { IdentifierStub } from '@dungeonmaster/shared/contracts';

describe('isProcessCwdCallGuard', () => {
  describe('process.cwd() calls', () => {
    it('VALID: {node: process.cwd() CallExpression} => true', () => {
      const callee = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: IdentifierStub({ value: 'process' }),
        }),
        property: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: IdentifierStub({ value: 'cwd' }),
        }),
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee,
      });

      const result = isProcessCwdCallGuard({ node });

      expect(result).toBe(true);
    });
  });

  describe('non-matching nodes', () => {
    it('VALID: {node: undefined} => false', () => {
      const result = isProcessCwdCallGuard({ node: undefined });

      expect(result).toBe(false);
    });

    it('VALID: {node: Identifier} => false', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.Identifier,
        name: IdentifierStub({ value: 'process' }),
      });

      const result = isProcessCwdCallGuard({ node });

      expect(result).toBe(false);
    });

    it('VALID: {node: process.env CallExpression} => false', () => {
      const callee = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: IdentifierStub({ value: 'process' }),
        }),
        property: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: IdentifierStub({ value: 'env' }),
        }),
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee,
      });

      const result = isProcessCwdCallGuard({ node });

      expect(result).toBe(false);
    });

    it('VALID: {node: foo.cwd() CallExpression} => false', () => {
      const callee = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: IdentifierStub({ value: 'foo' }),
        }),
        property: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: IdentifierStub({ value: 'cwd' }),
        }),
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee,
      });

      const result = isProcessCwdCallGuard({ node });

      expect(result).toBe(false);
    });

    it('VALID: {node: bare cwd() CallExpression with Identifier callee} => false', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: IdentifierStub({ value: 'cwd' }),
        }),
      });

      const result = isProcessCwdCallGuard({ node });

      expect(result).toBe(false);
    });
  });
});
