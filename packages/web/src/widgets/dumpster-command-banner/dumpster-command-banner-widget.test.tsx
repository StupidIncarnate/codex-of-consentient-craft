import { waitFor } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { DisplayLabelStub } from '../../contracts/display-label/display-label.stub';
import { DumpsterCommandBannerWidget } from './dumpster-command-banner-widget';
import { DumpsterCommandBannerWidgetProxy } from './dumpster-command-banner-widget.proxy';

describe('DumpsterCommandBannerWidget', () => {
  describe('rendering', () => {
    it('VALID: {message, command} => renders banner with the command and a COPY button', () => {
      const proxy = DumpsterCommandBannerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <DumpsterCommandBannerWidget
            message={DisplayLabelStub({ value: 'Run this in your Claude session' })}
            command={DisplayLabelStub({ value: '/dumpster-launch' })}
          />
        ),
      });

      expect(proxy.hasBanner()).toBe(true);
      expect(proxy.getCommandText()).toBe('/dumpster-launch');
      expect(proxy.getCopyButtonLabel()).toBe('COPY');
    });
  });

  describe('copy interaction', () => {
    it('VALID: {click COPY} => writes the command to the clipboard and flips the label to COPIED', async () => {
      const proxy = DumpsterCommandBannerWidgetProxy();
      proxy.setupClipboardSucceeds({ text: '/dumpster-launch' });

      mantineRenderAdapter({
        ui: (
          <DumpsterCommandBannerWidget
            message={DisplayLabelStub({ value: 'Run this in your Claude session' })}
            command={DisplayLabelStub({ value: '/dumpster-launch' })}
          />
        ),
      });

      await proxy.clickCopy();

      await waitFor(() => {
        expect(proxy.getCopyButtonLabel()).toBe('COPIED');
      });

      expect(proxy.wasCopiedWith({ text: '/dumpster-launch' })).toBe(true);
    });

    it('ERROR: {clipboard rejects} => label stays COPY and console.error logs the failure tag', async () => {
      const proxy = DumpsterCommandBannerWidgetProxy();
      const consoleErrorSpy = proxy.setupConsoleErrorCapture();
      const clipboardError = new Error('NotAllowedError');
      proxy.setupClipboardThrows({ text: '/dumpster-launch', error: clipboardError });

      mantineRenderAdapter({
        ui: (
          <DumpsterCommandBannerWidget
            message={DisplayLabelStub({ value: 'Run this in your Claude session' })}
            command={DisplayLabelStub({ value: '/dumpster-launch' })}
          />
        ),
      });

      await proxy.clickCopy();

      await waitFor(() => {
        expect(
          consoleErrorSpy.callsMatching(['[dumpster-command-banner] copy failed']),
        ).toStrictEqual([['[dumpster-command-banner] copy failed', clipboardError]]);
      });

      expect(proxy.getCopyButtonLabel()).toBe('COPY');
    });
  });
});
