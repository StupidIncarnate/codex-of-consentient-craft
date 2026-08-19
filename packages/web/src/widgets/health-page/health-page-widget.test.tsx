import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { HealthPageWidget } from './health-page-widget';
import { HealthPageWidgetProxy } from './health-page-widget.proxy';

describe('HealthPageWidget', () => {
  describe('rendering', () => {
    it('VALID: {} => renders the HEALTH_PAGE container', () => {
      const proxy = HealthPageWidgetProxy();

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      expect(proxy.hasHealthPage()).toBe(true);
    });

    it("VALID: {} => renders the title text 'SERVER HEALTH'", () => {
      const proxy = HealthPageWidgetProxy();

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      expect(proxy.getTitleText()).toBe('SERVER HEALTH');
    });

    it('VALID: {} => renders the container in monospace', () => {
      HealthPageWidgetProxy();

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      const container = screen.getByTestId('HEALTH_PAGE');

      expect(container.style.fontFamily).toBe('monospace');
    });
  });
});
