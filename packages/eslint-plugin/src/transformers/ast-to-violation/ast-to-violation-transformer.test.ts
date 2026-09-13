import { astToViolationTransformer } from './ast-to-violation-transformer';
import { AstNodeStub } from '../../contracts/ast-node/ast-node.stub';
import { RuleViolationStub } from '../../contracts/rule-violation/rule-violation.stub';

describe('astToViolationTransformer', () => {
  it('VALID: {node, violation with message only} => returns RuleViolation with required fields', () => {
    const node = AstNodeStub();
    const violation = RuleViolationStub({ message: 'Test violation' });

    const result = astToViolationTransformer({ node, violation });

    expect(result).toStrictEqual({
      node,
      message: violation.message,
      messageId: undefined,
      data: undefined,
    });
  });

  it('VALID: {node, violation with messageId} => returns RuleViolation with messageId', () => {
    const node = AstNodeStub();
    const violation = RuleViolationStub({
      message: 'Missing return type',
      messageId: 'missingReturnType',
    });

    const result = astToViolationTransformer({ node, violation });

    expect(result).toStrictEqual({
      node,
      message: violation.message,
      messageId: violation.messageId,
      data: undefined,
    });
  });

  it('VALID: {node, violation with messageId and data} => returns RuleViolation with all fields', () => {
    const node = AstNodeStub();
    const data = Object.create(null) as Record<PropertyKey, unknown>;
    data.functionName = 'testFunc';
    data.issue = 'no params';
    const violation = RuleViolationStub({
      message: 'Invalid function',
      messageId: 'invalidFunction',
      data,
    });

    const result = astToViolationTransformer({ node, violation });

    expect(result).toStrictEqual({
      node,
      message: violation.message,
      messageId: violation.messageId,
      data: violation.data,
    });
  });

  it('VALID: {node with all props, violation with data but no messageId} => returns RuleViolation with data but no messageId', () => {
    const node = AstNodeStub({
      type: 'VariableDeclaration',
      range: [5, 15],
      loc: {
        start: { line: 2, column: 5 },
        end: { line: 2, column: 15 },
      },
      parent: undefined,
    });
    const data = Object.create(null) as Record<PropertyKey, unknown>;
    data.varName = 'x';
    data.type = 'let';
    const violation = RuleViolationStub({ message: 'Variable issue', data });

    const result = astToViolationTransformer({ node, violation });

    expect(result).toStrictEqual({
      node,
      message: violation.message,
      messageId: undefined,
      data: violation.data,
    });
  });
});
