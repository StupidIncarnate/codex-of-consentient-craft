import { widgetTreeStatics } from './widget-tree-statics';

describe('widgetTreeStatics', () => {
  it('VALID: {widgetTreeStatics} => has expected hub threshold and max depth', () => {
    expect(widgetTreeStatics).toStrictEqual({
      hubInDegreeThreshold: 5,
      maxChildDepth: 2,
      rootSourceFolders: ['responders', 'flows'],
      widgetsFolderName: 'widgets',
      bindingsFolderName: 'bindings',
      tsSuffix: '.ts',
      tsxSuffix: '.tsx',
    });
  });
});
