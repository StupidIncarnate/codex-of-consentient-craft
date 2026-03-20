import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { FloorNameStub } from '../../contracts/floor-name/floor-name.stub';
import { FloorNumberStub } from '../../contracts/floor-number/floor-number.stub';
import { SlotCountStub } from '../../contracts/slot-count/slot-count.stub';
import { FloorHeaderLayerWidget } from './floor-header-layer-widget';
import { FloorHeaderLayerWidgetProxy } from './floor-header-layer-widget.proxy';

describe('FloorHeaderLayerWidget', () => {
  describe('floor label', () => {
    it('VALID: {floorNumber: 1, name: "CARTOGRAPHY"} => renders floor label', () => {
      FloorHeaderLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <FloorHeaderLayerWidget
            floorNumber={FloorNumberStub({ value: 1 })}
            name={FloorNameStub({ value: 'CARTOGRAPHY' })}
          />
        ),
      });

      const header = screen.getByTestId('floor-header-layer-widget');

      expect(header.textContent).toMatch(/FLOOR 1: CARTOGRAPHY/u);
    });

    it('VALID: {floorNumber: 3, name: "GAUNTLET"} => renders different floor', () => {
      FloorHeaderLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <FloorHeaderLayerWidget
            floorNumber={FloorNumberStub({ value: 3 })}
            name={FloorNameStub({ value: 'GAUNTLET' })}
          />
        ),
      });

      const header = screen.getByTestId('floor-header-layer-widget');

      expect(header.textContent).toMatch(/FLOOR 3: GAUNTLET/u);
    });
  });

  describe('dash separators', () => {
    it('VALID: {any props} => renders leading dashes', () => {
      FloorHeaderLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <FloorHeaderLayerWidget floorNumber={FloorNumberStub()} name={FloorNameStub()} />,
      });

      const header = screen.getByTestId('floor-header-layer-widget');

      expect(header.textContent).toMatch(/──/u);
    });
  });

  describe('concurrent info', () => {
    it('VALID: {concurrent provided} => renders concurrent count', () => {
      FloorHeaderLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <FloorHeaderLayerWidget
            floorNumber={FloorNumberStub()}
            name={FloorNameStub()}
            concurrent={{
              active: SlotCountStub({ value: 2 }),
              max: SlotCountStub({ value: 3 }),
            }}
          />
        ),
      });

      const concurrent = screen.getByTestId('floor-header-concurrent');

      expect(concurrent.textContent).toBe('Concurrent: 2/3');
    });

    it('EMPTY: {no concurrent} => does not render concurrent section', () => {
      FloorHeaderLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <FloorHeaderLayerWidget floorNumber={FloorNumberStub()} name={FloorNameStub()} />,
      });

      expect(screen.queryByTestId('floor-header-concurrent')).toBeNull();
    });
  });

  describe('null floor number', () => {
    it('VALID: {floorNumber: null, name: "HOMEBASE"} => renders name without FLOOR prefix', () => {
      FloorHeaderLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <FloorHeaderLayerWidget floorNumber={null} name={FloorNameStub({ value: 'HOMEBASE' })} />
        ),
      });

      const header = screen.getByTestId('floor-header-layer-widget');

      expect(header.textContent).toMatch(/HOMEBASE/u);
      expect(header.textContent).not.toMatch(/FLOOR/u);
    });

    it('VALID: {floorNumber: null, name: "ENTRANCE: CARTOGRAPHY"} => renders entrance name', () => {
      FloorHeaderLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <FloorHeaderLayerWidget
            floorNumber={null}
            name={FloorNameStub({ value: 'ENTRANCE: CARTOGRAPHY' })}
          />
        ),
      });

      const header = screen.getByTestId('floor-header-layer-widget');

      expect(header.textContent).toMatch(/ENTRANCE: CARTOGRAPHY/u);
      expect(header.textContent).not.toMatch(/FLOOR/u);
    });
  });
});
