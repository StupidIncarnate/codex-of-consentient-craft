import { AstNodeStub } from './ast-node.stub';

describe('AstNodeStub', () => {
  it('VALID: {} => returns default AstNode', () => {
    const result = AstNodeStub();

    expect(result).toStrictEqual({
      type: 'Identifier',
      range: [0, 10],
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 10 },
      },
    });
  });

  it('VALID: {type: "Literal"} => returns AstNode with custom type', () => {
    const result = AstNodeStub({ type: 'Literal' });

    expect(result.type).toBe('Literal');
  });

  it('VALID: {range: [5, 15]} => returns AstNode with custom range', () => {
    const result = AstNodeStub({ range: [5, 15] });

    expect(result.range).toStrictEqual([5, 15]);
  });

  it('VALID: {loc: custom} => returns AstNode with custom location', () => {
    const result = AstNodeStub({
      loc: {
        start: { line: 2, column: 5 },
        end: { line: 2, column: 20 },
      },
    });

    expect(result.loc).toStrictEqual({
      start: { line: 2, column: 5 },
      end: { line: 2, column: 20 },
    });
  });

  it('INVALID: {type: ""} => throws ZodError for empty type', () => {
    expect(() => {
      AstNodeStub({ type: '' });
    }).toThrow('String must contain at least 1 character(s)');
  });

  it('INVALID: {range: [-1, 10]} => throws ZodError for negative range', () => {
    expect(() => {
      AstNodeStub({ range: [-1, 10] });
    }).toThrow('Number must be greater than or equal to 0');
  });

  it('INVALID: {loc: {start: {line: 0}}} => throws ZodError for non-positive line', () => {
    expect(() => {
      AstNodeStub({
        loc: {
          start: { line: 0, column: 0 },
          end: { line: 1, column: 10 },
        },
      });
    }).toThrow('Number must be greater than 0');
  });

  it('INVALID: {loc: {start: {column: -1}}} => throws ZodError for negative column', () => {
    expect(() => {
      AstNodeStub({
        loc: {
          start: { line: 1, column: -1 },
          end: { line: 1, column: 10 },
        },
      });
    }).toThrow('Number must be greater than or equal to 0');
  });
});
