import { widgetEdgesContract } from './widget-edges-contract';
import { WidgetEdgesStub } from './widget-edges.stub';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../content-text/content-text.stub';

describe('widgetEdgesContract', () => {
  describe('valid edges', () => {
    it('VALID: {empty paths and names} => parses successfully', () => {
      const result = WidgetEdgesStub();

      const parsed = widgetEdgesContract.parse(result);

      expect(parsed).toStrictEqual({ childWidgetPaths: [], bindingNames: [] });
    });

    it('VALID: {populated child paths and binding names} => parses successfully', () => {
      const childPath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/child/child-widget.tsx',
      });
      const bindingName = ContentTextStub({ value: 'use-quest-binding' });

      const result = WidgetEdgesStub({
        childWidgetPaths: [childPath],
        bindingNames: [bindingName],
      });

      const parsed = widgetEdgesContract.parse(result);

      expect(parsed).toStrictEqual({
        childWidgetPaths: ['/repo/packages/web/src/widgets/child/child-widget.tsx'],
        bindingNames: ['use-quest-binding'],
      });
    });
  });

  describe('invalid edges', () => {
    it('INVALID: {missing childWidgetPaths} => throws validation error', () => {
      expect(() => {
        return widgetEdgesContract.parse({ bindingNames: [] });
      }).toThrow(/Required/u);
    });

    it('INVALID: {missing bindingNames} => throws validation error', () => {
      expect(() => {
        return widgetEdgesContract.parse({ childWidgetPaths: [] });
      }).toThrow(/Required/u);
    });
  });
});
