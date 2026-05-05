import { widgetTreeStatics } from './widget-tree-statics';

describe('widgetTreeStatics', () => {
  it('VALID: {widgetTreeStatics} => has expected hub threshold and folder constants', () => {
    expect(widgetTreeStatics).toStrictEqual({
      hubInDegreeThreshold: 5,
      rootSourceFolders: ['responders', 'flows'],
      widgetsFolderName: 'widgets',
      bindingsFolderName: 'bindings',
      tsSuffix: '.ts',
      tsxSuffix: '.tsx',
    });
  });
});
