import { HealthSnapshotStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { healthPageRowsStatics } from '../../statics/health-page-rows/health-page-rows-statics';
import { HealthTableLayerWidget } from './health-table-layer-widget';
import { HealthTableLayerWidgetProxy } from './health-table-layer-widget.proxy';

describe('HealthTableLayerWidget', () => {
  describe('row testids', () => {
    it('VALID: {snapshot} => renders exactly the 7 HEALTH_PAGE_ROW_* testids', () => {
      const proxy = HealthTableLayerWidgetProxy();
      const snapshot = HealthSnapshotStub();

      mantineRenderAdapter({ ui: <HealthTableLayerWidget snapshot={snapshot} /> });

      const renderedTestIds = proxy.getRows().map((row) => row.getAttribute('data-testid'));
      const expectedTestIds = healthPageRowsStatics.rows.map((row) => row.rowTestId);

      expect(renderedTestIds).toStrictEqual(expectedTestIds);
    });
  });

  describe('value cells', () => {
    it('VALID: {snapshot} => each row value cell renders its field verbatim', () => {
      const proxy = HealthTableLayerWidgetProxy();
      const snapshot = HealthSnapshotStub();

      mantineRenderAdapter({ ui: <HealthTableLayerWidget snapshot={snapshot} /> });

      const renderedValues = Object.fromEntries(
        healthPageRowsStatics.rows.map((row) => [
          row.valueTestId,
          proxy.getValueText({ valueTestId: row.valueTestId }),
        ]),
      );
      const expectedValues = Object.fromEntries(
        healthPageRowsStatics.rows.map((row) => [row.valueTestId, String(snapshot[row.field])]),
      );

      expect(renderedValues).toStrictEqual(expectedValues);
    });

    it("VALID: {port: 3737, orchestrationMode: 'claude'} => port renders '3737' and orchestrationMode renders 'claude'", () => {
      const proxy = HealthTableLayerWidgetProxy();
      const snapshot = HealthSnapshotStub({ port: 3737, orchestrationMode: 'claude' });

      mantineRenderAdapter({ ui: <HealthTableLayerWidget snapshot={snapshot} /> });

      expect({
        port: proxy.getValueText({ valueTestId: 'HEALTH_PAGE_VALUE_PORT' }),
        orchestrationMode: proxy.getValueText({
          valueTestId: 'HEALTH_PAGE_VALUE_ORCHESTRATION_MODE',
        }),
      }).toStrictEqual({ port: '3737', orchestrationMode: 'claude' });
    });
  });
});
