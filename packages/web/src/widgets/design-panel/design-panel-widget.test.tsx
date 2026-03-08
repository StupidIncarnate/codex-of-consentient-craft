/**
 * PURPOSE: Tests for DesignPanelWidget - design sandbox iframe or placeholder
 */

import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { DesignPanelWidget } from './design-panel-widget';
import { DesignPanelWidgetProxy } from './design-panel-widget.proxy';

type Quest = ReturnType<typeof QuestStub>;

describe('DesignPanelWidget', () => {
  describe('without designPort', () => {
    it('VALID: {designPort undefined} => renders placeholder', () => {
      const proxy = DesignPanelWidgetProxy();

      mantineRenderAdapter({
        ui: <DesignPanelWidget />,
      });

      expect(proxy.hasPlaceholder()).toBe(true);
      expect(proxy.hasIframe()).toBe(false);
    });
  });

  describe('with designPort', () => {
    it('VALID: {designPort: 5173} => renders iframe with correct src', () => {
      const proxy = DesignPanelWidgetProxy();
      const port = 5173 as unknown as Quest['designPort'];

      mantineRenderAdapter({
        ui: <DesignPanelWidget designPort={port} />,
      });

      expect(proxy.hasIframe()).toBe(true);
      expect(proxy.hasPlaceholder()).toBe(false);
      expect(proxy.getIframeSrc()).toBe('http://localhost:5173');
    });

    it('VALID: {designPort: 3000} => renders iframe with port 3000', () => {
      const proxy = DesignPanelWidgetProxy();
      const port = 3000 as unknown as Quest['designPort'];

      mantineRenderAdapter({
        ui: <DesignPanelWidget designPort={port} />,
      });

      expect(proxy.getIframeSrc()).toBe('http://localhost:3000');
    });
  });
});
