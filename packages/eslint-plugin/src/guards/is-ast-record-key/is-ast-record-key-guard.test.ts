import { NewExpressionStub } from '#gateway/npm/typescript-eslint__utils/new-expression/new-expression.stub';
import { isAstRecordKeyGuard } from './is-ast-record-key-guard';

// The node is a `new` expression because a stub finds the OUTERMOST node of a type first, and the
// `new` expression is the only one in each snippet.
describe('isAstRecordKeyGuard', () => {
  it('VALID: {node: z.record key} => returns true', () => {
    const node = NewExpressionStub({ code: 'z.record(new S(), z.number());' });

    expect(isAstRecordKeyGuard({ node })).toBe(true);
  });

  it('VALID: {node: z.record key with a chain} => returns true', () => {
    const node = NewExpressionStub({ code: "z.record(new S().min(1).brand<'K'>(), z.number());" });

    expect(isAstRecordKeyGuard({ node })).toBe(true);
  });

  it('VALID: {node: z.partialRecord key} => returns true', () => {
    const node = NewExpressionStub({ code: 'z.partialRecord(new S(), z.number());' });

    expect(isAstRecordKeyGuard({ node })).toBe(true);
  });

  it('VALID: {node: z.looseRecord key} => returns true', () => {
    const node = NewExpressionStub({ code: 'z.looseRecord(new S(), z.number());' });

    expect(isAstRecordKeyGuard({ node })).toBe(true);
  });

  it('INVALID: {node: z.record value} => returns false', () => {
    const node = NewExpressionStub({ code: 'z.record(z.string(), new S());' });

    expect(isAstRecordKeyGuard({ node })).toBe(false);
  });

  it('VALID: {node: z.map key} => returns true', () => {
    const node = NewExpressionStub({ code: 'z.map(new S(), z.number());' });

    expect(isAstRecordKeyGuard({ node })).toBe(true);
  });

  it('INVALID: {node: z.map value} => returns false', () => {
    const node = NewExpressionStub({ code: 'z.map(z.string(), new S());' });

    expect(isAstRecordKeyGuard({ node })).toBe(false);
  });

  it('INVALID: {node: first argument of another call} => returns false', () => {
    const node = NewExpressionStub({ code: 'f(new S());' });

    expect(isAstRecordKeyGuard({ node })).toBe(false);
  });

  it('EMPTY: {node omitted} => returns false', () => {
    expect(isAstRecordKeyGuard({})).toBe(false);
  });
});
