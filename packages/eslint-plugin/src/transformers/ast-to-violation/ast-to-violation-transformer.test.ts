import { astToViolationTransformer } from './ast-to-violation-transformer';
import { AstNodeStub } from '../../contracts/ast-node/ast-node.stub';
import { RuleViolationStub } from '../../contracts/rule-violation/rule-violation.stub';

describe('astToViolationTransformer', () => {
  it('VALID: {node, message} => returns RuleViolation with required fields', () => {
    const node = AstNodeStub();
    const { message } = RuleViolationStub({ message: 'Test violation' });

    const result = astToViolationTransformer({ node, message });

    expect(result).toStrictEqual({
      node,
      message,
      messageId: undefined,
      data: undefined,
    });
  });

  it('VALID: {node, message, messageId} => returns RuleViolation with messageId', () => {
    const node = AstNodeStub();
    const { message, messageId } = RuleViolationStub({
      message: 'Missing return type',
      messageId: 'missingReturnType',
    });

    const result = astToViolationTransformer({ node, message, messageId });

    expect(result).toStrictEqual({
      node,
      message,
      messageId,
      data: undefined,
    });
  });

  it('VALID: {node, message, messageId, data} => returns RuleViolation with all fields', () => {
    const node = AstNodeStub();
    const { message, messageId } = RuleViolationStub({
      message: 'Invalid function',
      messageId: 'invalidFunction',
    });
    const data = { functionName: 'testFunc', issue: 'no params' };

    const result = astToViolationTransformer({ node, message, messageId, data });

    expect(result).toStrictEqual({
      node,
      message,
      messageId,
      data,
    });
  });

  it('VALID: {node with all props, message, data} => returns RuleViolation with data but no messageId', () => {
    const node = AstNodeStub({
      type: 'VariableDeclaration',
      range: [5, 15],
      loc: {
        start: { line: 2, column: 5 },
        end: { line: 2, column: 15 },
      },
      parent: undefined,
    });
    const { message } = RuleViolationStub({ message: 'Variable issue' });
    const data = { varName: 'x', type: 'let' };

    const result = astToViolationTransformer({ node, message, data });

    expect(result).toStrictEqual({
      node,
      message,
      messageId: undefined,
      data,
    });
  });
});
