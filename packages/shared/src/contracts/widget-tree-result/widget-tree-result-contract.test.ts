import { widgetTreeResultContract } from './widget-tree-result-contract';
import { WidgetTreeResultStub } from './widget-tree-result.stub';
import { WidgetNodeStub } from '../widget-node/widget-node.stub';
import { ContentTextStub } from '../content-text/content-text.stub';

describe('widgetTreeResultContract', () => {
  describe('valid results', () => {
    it('VALID: {empty roots and hubs} => parses successfully', () => {
      const result = WidgetTreeResultStub();

      const parsed = widgetTreeResultContract.parse(result);

      expect(parsed).toStrictEqual({
        roots: [],
        hubs: [],
      });
    });

    it('VALID: {populated roots and hubs} => parses successfully', () => {
      const node = WidgetNodeStub();
      const hub = ContentTextStub({ value: 'shared-widget' });

      const result = WidgetTreeResultStub({
        roots: [node],
        hubs: [hub],
      });

      const parsed = widgetTreeResultContract.parse(result);

      expect(parsed).toStrictEqual({
        roots: [
          {
            widgetName: 'stub-widget',
            filePath: '/stub/src/widgets/stub/stub-widget.tsx',
            bindingsAttached: [],
            children: [],
          },
        ],
        hubs: ['shared-widget'],
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {missing roots} => throws validation error', () => {
      expect(() => {
        return widgetTreeResultContract.parse({
          hubs: [],
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {missing hubs} => throws validation error', () => {
      expect(() => {
        return widgetTreeResultContract.parse({
          roots: [],
        });
      }).toThrow(/Required/u);
    });
  });
});
