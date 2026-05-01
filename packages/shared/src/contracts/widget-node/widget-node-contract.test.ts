import { widgetNodeContract } from './widget-node-contract';
import { WidgetNodeStub } from './widget-node.stub';
import { ContentTextStub } from '../content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';

describe('widgetNodeContract', () => {
  describe('valid nodes', () => {
    it('VALID: {leaf node with no children} => parses successfully', () => {
      const result = WidgetNodeStub();

      const parsed = widgetNodeContract.parse(result);

      expect(parsed).toStrictEqual({
        widgetName: 'stub-widget',
        filePath: '/stub/src/widgets/stub/stub-widget.tsx',
        bindingsAttached: [],
        children: [],
      });
    });

    it('VALID: {node with children and bindings} => parses successfully', () => {
      const child = WidgetNodeStub({
        widgetName: ContentTextStub({ value: 'child-widget' }),
        filePath: AbsoluteFilePathStub({ value: '/stub/src/widgets/child/child-widget.tsx' }),
      });

      const result = WidgetNodeStub({
        widgetName: ContentTextStub({ value: 'parent-widget' }),
        filePath: AbsoluteFilePathStub({ value: '/stub/src/widgets/parent/parent-widget.tsx' }),
        bindingsAttached: [ContentTextStub({ value: 'use-data-binding' })],
        children: [child],
      });

      const parsed = widgetNodeContract.parse(result);

      expect(parsed).toStrictEqual({
        widgetName: 'parent-widget',
        filePath: '/stub/src/widgets/parent/parent-widget.tsx',
        bindingsAttached: ['use-data-binding'],
        children: [
          {
            widgetName: 'child-widget',
            filePath: '/stub/src/widgets/child/child-widget.tsx',
            bindingsAttached: [],
            children: [],
          },
        ],
      });
    });
  });

  describe('invalid nodes', () => {
    it('INVALID: {missing widgetName} => throws validation error', () => {
      expect(() => {
        return widgetNodeContract.parse({
          filePath: '/stub/src/widgets/stub/stub-widget.tsx',
          bindingsAttached: [],
          children: [],
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {missing filePath} => throws validation error', () => {
      expect(() => {
        return widgetNodeContract.parse({
          widgetName: 'stub-widget',
          bindingsAttached: [],
          children: [],
        });
      }).toThrow(/Required/u);
    });
  });
});
