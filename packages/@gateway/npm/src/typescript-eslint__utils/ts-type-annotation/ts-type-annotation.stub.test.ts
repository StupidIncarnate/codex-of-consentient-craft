import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSTypeAnnotationStub } from './ts-type-annotation.stub';

describe('TSTypeAnnotationStub', () => {
  it('VALID: {} => a real TSTypeAnnotation parsed from the default code', () => {
    const node = TSTypeAnnotationStub();

    expect({ type: node.type, text: 'let x: string;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.TSTypeAnnotation,
      text: ': string',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSTypeAnnotationStub({ code: '  let x: string;' });

    expect(node.range).toStrictEqual([
      TSTypeAnnotationStub().range[0] + 2,
      TSTypeAnnotationStub().range[1] + 2,
    ]);
  });
});
