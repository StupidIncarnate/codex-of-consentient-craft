import { PackageNameStub } from '@dungeonmaster/shared/contracts';

import { recipesScaffoldState } from './recipes-scaffold-state';
import { recipesScaffoldStateProxy } from './recipes-scaffold-state.proxy';

describe('recipesScaffoldState', () => {
  describe('consumeScaffolded()', () => {
    it('EMPTY: {no markScaffolded call} => returns recipesPackageName: undefined', () => {
      const proxy = recipesScaffoldStateProxy();
      proxy.setupEmpty();

      expect(recipesScaffoldState.consumeScaffolded()).toStrictEqual({
        recipesPackageName: undefined,
      });
    });

    it('VALID: {markScaffolded then consumeScaffolded} => returns the marked recipesPackageName', () => {
      const proxy = recipesScaffoldStateProxy();
      proxy.setupEmpty();
      const recipesPackageName = PackageNameStub({ value: 'hydration-recipes' });

      recipesScaffoldState.markScaffolded({ recipesPackageName });

      expect(recipesScaffoldState.consumeScaffolded()).toStrictEqual({
        recipesPackageName: 'hydration-recipes',
      });
    });

    it('VALID: {consumeScaffolded called twice after one markScaffolded} => the second read drains to undefined', () => {
      const proxy = recipesScaffoldStateProxy();
      proxy.setupEmpty();
      const recipesPackageName = PackageNameStub({ value: 'hydration-recipes' });
      recipesScaffoldState.markScaffolded({ recipesPackageName });

      recipesScaffoldState.consumeScaffolded();

      expect(recipesScaffoldState.consumeScaffolded()).toStrictEqual({
        recipesPackageName: undefined,
      });
    });

    it('VALID: {two markScaffolded calls before any consume} => the second mark replaces the first', () => {
      const proxy = recipesScaffoldStateProxy();
      proxy.setupEmpty();
      recipesScaffoldState.markScaffolded({
        recipesPackageName: PackageNameStub({ value: 'hydration-recipes' }),
      });

      recipesScaffoldState.markScaffolded({
        recipesPackageName: PackageNameStub({ value: '@acme/hydration-recipes' }),
      });

      expect(recipesScaffoldState.consumeScaffolded()).toStrictEqual({
        recipesPackageName: '@acme/hydration-recipes',
      });
    });
  });

  describe('clear()', () => {
    it('VALID: {clear after markScaffolded} => consumeScaffolded reads undefined', () => {
      const proxy = recipesScaffoldStateProxy();
      proxy.setupEmpty();
      recipesScaffoldState.markScaffolded({
        recipesPackageName: PackageNameStub({ value: 'hydration-recipes' }),
      });

      recipesScaffoldState.clear();

      expect(recipesScaffoldState.consumeScaffolded()).toStrictEqual({
        recipesPackageName: undefined,
      });
    });
  });
});
