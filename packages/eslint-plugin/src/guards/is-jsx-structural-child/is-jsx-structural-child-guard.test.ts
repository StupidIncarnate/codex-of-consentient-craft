import { JSXElementStub } from '#gateway/npm/typescript-eslint__utils/jsx-element/jsx-element.stub';
import { JSXFragmentStub } from '#gateway/npm/typescript-eslint__utils/jsx-fragment/jsx-fragment.stub';
import { JSXExpressionContainerStub } from '#gateway/npm/typescript-eslint__utils/jsx-expression-container/jsx-expression-container.stub';
import { JSXTextStub } from '#gateway/npm/typescript-eslint__utils/jsx-text/jsx-text.stub';
import { isJsxStructuralChildGuard } from './is-jsx-structural-child-guard';

describe('isJsxStructuralChildGuard', () => {
  describe('structural children', () => {
    it('VALID: {child: JSXElement} => returns true', () => {
      const child = JSXElementStub({ code: 'const j = <div />;' });

      expect(isJsxStructuralChildGuard({ child })).toBe(true);
    });

    it('VALID: {child: JSXFragment} => returns true', () => {
      const child = JSXFragmentStub({ code: 'const j = <></>;' });

      expect(isJsxStructuralChildGuard({ child })).toBe(true);
    });

    it('VALID: {container wrapping an element} => returns true', () => {
      const child = JSXExpressionContainerStub({ code: 'const j = <a>{<div />}</a>;' });

      expect(isJsxStructuralChildGuard({ child })).toBe(true);
    });

    it('VALID: {container wrapping a ternary whose consequent is an element} => returns true', () => {
      const child = JSXExpressionContainerStub({ code: 'const j = <a>{a ? <div /> : 0}</a>;' });

      expect(isJsxStructuralChildGuard({ child })).toBe(true);
    });

    it('VALID: {container wrapping a ternary whose ALTERNATE is an element} => returns true', () => {
      const child = JSXExpressionContainerStub({ code: 'const j = <a>{a ? 0 : <div />}</a>;' });

      expect(isJsxStructuralChildGuard({ child })).toBe(true);
    });

    it('VALID: {container wrapping cond && <El/>} => returns true', () => {
      const child = JSXExpressionContainerStub({ code: 'const j = <a>{a && <div />}</a>;' });

      expect(isJsxStructuralChildGuard({ child })).toBe(true);
    });
  });

  describe('leaf children', () => {
    it('INVALID: {child: JSXText} => returns false', () => {
      const child = JSXTextStub({ code: 'const j = <a>text</a>;' });

      expect(isJsxStructuralChildGuard({ child })).toBe(false);
    });

    it('INVALID: {container wrapping an identifier} => returns false', () => {
      const child = JSXExpressionContainerStub({ code: 'const j = <a>{x}</a>;' });

      expect(isJsxStructuralChildGuard({ child })).toBe(false);
    });

    it('INVALID: {container wrapping a ternary between two values} => returns false', () => {
      const child = JSXExpressionContainerStub({ code: 'const j = <a>{a ? 0 : 0}</a>;' });

      expect(isJsxStructuralChildGuard({ child })).toBe(false);
    });

    it('EMPTY: {container with no expression} => returns false', () => {
      const child = JSXExpressionContainerStub({ code: 'const j = <a>{}</a>;' });

      expect(isJsxStructuralChildGuard({ child })).toBe(false);
    });

    it('EMPTY: {child: undefined} => returns false', () => {
      expect(isJsxStructuralChildGuard({})).toBe(false);
    });
  });
});
