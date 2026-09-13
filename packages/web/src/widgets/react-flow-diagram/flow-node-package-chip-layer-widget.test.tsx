import { ReactFlowPackageChipStub } from '../../contracts/react-flow-package-chip/react-flow-package-chip.stub';
import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { packageTypeStyleStatics } from '../../statics/package-type-style/package-type-style-statics';
import { FlowNodePackageChipLayerWidget } from './flow-node-package-chip-layer-widget';
import { FlowNodePackageChipLayerWidgetProxy } from './flow-node-package-chip-layer-widget.proxy';

describe('FlowNodePackageChipLayerWidget', () => {
  describe('resolved package type', () => {
    it('VALID: {pkg: storefront-ui, frontend-react} => chip shows the name and the frontend-react accent token', () => {
      const proxy = FlowNodePackageChipLayerWidgetProxy();
      const pkg = ReactFlowPackageChipStub({
        name: 'storefront-ui',
        packageType: 'frontend-react',
      });

      mantineRenderAdapter({ ui: <FlowNodePackageChipLayerWidget pkg={pkg} /> });

      expect(proxy.getChipName()).toBe('storefront-ui');
      expect(proxy.getChipAccent()).toBe(packageTypeStyleStatics.accent['frontend-react']);
      expect(proxy.getChipPackageType()).toBe('frontend-react');
    });

    it('VALID: {pkg: shared-kit, library} => chip carries data-package-type "library"', () => {
      const proxy = FlowNodePackageChipLayerWidgetProxy();
      const pkg = ReactFlowPackageChipStub({ name: 'shared-kit', packageType: 'library' });

      mantineRenderAdapter({ ui: <FlowNodePackageChipLayerWidget pkg={pkg} /> });

      expect(proxy.getChipPackageType()).toBe('library');
    });
  });

  describe('unresolved package type', () => {
    it('EMPTY: {pkg with no packageType} => chip paints the unresolved token and carries no data-package-type', () => {
      const proxy = FlowNodePackageChipLayerWidgetProxy();
      const { packageType: _packageType, ...pkg } = ReactFlowPackageChipStub({
        name: 'never-declared',
      });

      mantineRenderAdapter({ ui: <FlowNodePackageChipLayerWidget pkg={pkg} /> });

      expect(proxy.getChipName()).toBe('never-declared');
      expect(proxy.getChipAccent()).toBe(packageTypeStyleStatics.unresolved);
      expect(proxy.getChipPackageType()).toBe(null);
    });
  });
});
