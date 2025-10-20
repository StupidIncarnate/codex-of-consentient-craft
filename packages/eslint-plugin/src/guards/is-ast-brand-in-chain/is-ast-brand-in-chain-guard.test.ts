import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';
import { isAstBrandInChainGuard } from './is-ast-brand-in-chain-guard';

describe('isAstBrandInChainGuard', () => {
  it('VALID: {node: z.string() with .brand() in chain} => returns true', () => {
    // z.string().brand<'Email'>()
    const brandMember = TsestreeStub({
      type: 'MemberExpression',
      property: TsestreeStub({
        type: 'Identifier',
        name: 'brand',
      }),
    });

    const stringCall = TsestreeStub({
      type: 'CallExpression',
      parent: brandMember,
    });

    expect(isAstBrandInChainGuard({ node: stringCall })).toBe(true);
  });

  it('VALID: {node: z.string().email() with .brand() in chain} => returns true', () => {
    // z.string().email().brand<'Email'>()
    const brandMember = TsestreeStub({
      type: 'MemberExpression',
      property: TsestreeStub({
        type: 'Identifier',
        name: 'brand',
      }),
    });

    const emailMember = TsestreeStub({
      type: 'MemberExpression',
      parent: brandMember,
    });

    const stringCall = TsestreeStub({
      type: 'CallExpression',
      parent: emailMember,
    });

    expect(isAstBrandInChainGuard({ node: stringCall })).toBe(true);
  });

  it('VALID: {node: z.number() with .brand() in chain} => returns true', () => {
    // z.number().brand<'UserId'>()
    const brandMember = TsestreeStub({
      type: 'MemberExpression',
      property: TsestreeStub({
        type: 'Identifier',
        name: 'brand',
      }),
    });

    const numberCall = TsestreeStub({
      type: 'CallExpression',
      parent: brandMember,
    });

    expect(isAstBrandInChainGuard({ node: numberCall })).toBe(true);
  });

  it('VALID: {node: deeply nested with .brand() somewhere up chain} => returns true', () => {
    // z.string().min(5).max(100).email().brand<'Email'>()
    const brandMember = TsestreeStub({
      type: 'MemberExpression',
      property: TsestreeStub({
        type: 'Identifier',
        name: 'brand',
      }),
    });

    const emailMember = TsestreeStub({
      type: 'MemberExpression',
      parent: brandMember,
    });

    const maxMember = TsestreeStub({
      type: 'MemberExpression',
      parent: emailMember,
    });

    const minMember = TsestreeStub({
      type: 'MemberExpression',
      parent: maxMember,
    });

    const stringCall = TsestreeStub({
      type: 'CallExpression',
      parent: minMember,
    });

    expect(isAstBrandInChainGuard({ node: stringCall })).toBe(true);
  });

  it('INVALID_NO_BRAND: {node: z.string() without .brand()} => returns false', () => {
    const stringCall = TsestreeStub({
      type: 'CallExpression',
      parent: null,
    });

    expect(isAstBrandInChainGuard({ node: stringCall })).toBe(false);
  });

  it('INVALID_NO_BRAND: {node: z.string().email() without .brand()} => returns false', () => {
    const emailCall = TsestreeStub({
      type: 'CallExpression',
      callee: TsestreeStub({
        type: 'MemberExpression',
        property: TsestreeStub({
          type: 'Identifier',
          name: 'email',
        }),
      }),
      parent: null,
    });

    const stringCall = TsestreeStub({
      type: 'CallExpression',
      parent: emailCall,
    });

    expect(isAstBrandInChainGuard({ node: stringCall })).toBe(false);
  });

  it('INVALID_DIFFERENT_METHOD: {node: chain with .optional() but not .brand()} => returns false', () => {
    const optionalCall = TsestreeStub({
      type: 'CallExpression',
      callee: TsestreeStub({
        type: 'MemberExpression',
        property: TsestreeStub({
          type: 'Identifier',
          name: 'optional',
        }),
      }),
    });

    const stringCall = TsestreeStub({
      type: 'CallExpression',
      parent: optionalCall,
    });

    expect(isAstBrandInChainGuard({ node: stringCall })).toBe(false);
  });

  it('INVALID_NO_PROPERTY: {node: parent with no property} => returns false', () => {
    const parentNode = TsestreeStub({
      type: 'CallExpression',
      property: undefined,
    });

    const node = TsestreeStub({
      type: 'CallExpression',
      parent: parentNode,
    });

    expect(isAstBrandInChainGuard({ node })).toBe(false);
  });

  it('EMPTY: {node omitted} => returns false', () => {
    expect(isAstBrandInChainGuard({})).toBe(false);
  });

  it('EMPTY: {node: with undefined parent} => returns false', () => {
    const node = TsestreeStub({
      type: 'CallExpression',
      parent: undefined,
    });

    expect(isAstBrandInChainGuard({ node })).toBe(false);
  });

  it('EMPTY: {node: with null parent} => returns false', () => {
    const node = TsestreeStub({
      type: 'CallExpression',
      parent: null,
    });

    expect(isAstBrandInChainGuard({ node })).toBe(false);
  });
});
