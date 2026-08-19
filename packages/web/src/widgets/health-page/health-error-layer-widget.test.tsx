import { within } from '@testing-library/react';

import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { healthErrorStatics } from '../../statics/health-error/health-error-statics';
import { HealthErrorLayerWidget } from './health-error-layer-widget';
import { HealthErrorLayerWidgetProxy } from './health-error-layer-widget.proxy';

const SPRITE_SCALE = 8;

const INVALID_BODY_MESSAGE =
  '[\n' +
  '  {\n' +
  '    "code": "invalid_type",\n' +
  '    "expected": "number",\n' +
  '    "received": "undefined",\n' +
  '    "path": [\n' +
  '      "uptimeSeconds"\n' +
  '    ],\n' +
  '    "message": "Required"\n' +
  '  }\n' +
  ']';

describe('HealthErrorLayerWidget', () => {
  describe('status + detail text', () => {
    it("VALID: {message: 'GET /api/health failed with status 500'} => status renders 'HTTP 500' and detail renders the message verbatim", () => {
      const proxy = HealthErrorLayerWidgetProxy();
      const message = ErrorMessageStub({ value: 'GET /api/health failed with status 500' });

      mantineRenderAdapter({
        ui: <HealthErrorLayerWidget message={message} onRetry={() => undefined} />,
      });

      expect([proxy.getStatusText(), proxy.getDetailText()]).toStrictEqual([
        'HTTP 500',
        'GET /api/health failed with status 500',
      ]);
    });

    it("VALID: {message: 'Failed to fetch'} => status renders 'NO RESPONSE'", () => {
      const proxy = HealthErrorLayerWidgetProxy();
      const message = ErrorMessageStub({ value: 'Failed to fetch' });

      mantineRenderAdapter({
        ui: <HealthErrorLayerWidget message={message} onRetry={() => undefined} />,
      });

      expect(proxy.getStatusText()).toBe('NO RESPONSE');
    });

    it("VALID: {message: healthErrorStatics.socketClosedMessage} => status renders 'CONNECTION LOST'", () => {
      const proxy = HealthErrorLayerWidgetProxy();
      const message = ErrorMessageStub({ value: healthErrorStatics.socketClosedMessage });

      mantineRenderAdapter({
        ui: <HealthErrorLayerWidget message={message} onRetry={() => undefined} />,
      });

      expect(proxy.getStatusText()).toBe('CONNECTION LOST');
    });

    it('VALID: {message: unparseable 200 body ZodError text} => HEALTH_PAGE_ERROR is visible and status renders NO RESPONSE', () => {
      const proxy = HealthErrorLayerWidgetProxy();
      const message = ErrorMessageStub({ value: INVALID_BODY_MESSAGE });

      const { queryByTestId } = mantineRenderAdapter({
        ui: <HealthErrorLayerWidget message={message} onRetry={() => undefined} />,
      });

      expect([queryByTestId('HEALTH_PAGE_ERROR') !== null, proxy.getStatusText()]).toStrictEqual([
        true,
        'NO RESPONSE',
      ]);
    });
  });

  describe('sad raccoon sprite', () => {
    it('VALID: {render} => HEALTH_PAGE_SAD_RACCOON renders PIXEL_SPRITE at scale 8', () => {
      const proxy = HealthErrorLayerWidgetProxy();
      const message = ErrorMessageStub();

      const { getByTestId } = mantineRenderAdapter({
        ui: <HealthErrorLayerWidget message={message} onRetry={() => undefined} />,
      });

      const raccoon = getByTestId('HEALTH_PAGE_SAD_RACCOON');
      const sprite = within(raccoon).getByTestId('PIXEL_SPRITE');

      expect([proxy.hasSadRaccoon(), sprite.style.width]).toStrictEqual([
        true,
        `${SPRITE_SCALE}px`,
      ]);
    });
  });

  describe('retry control', () => {
    it("VALID: {render} => HEALTH_PAGE_RETRY renders the exact text 'RETRY'", () => {
      const proxy = HealthErrorLayerWidgetProxy();
      const message = ErrorMessageStub();

      mantineRenderAdapter({
        ui: <HealthErrorLayerWidget message={message} onRetry={() => undefined} />,
      });

      expect(proxy.getRetryLabel()).toBe('RETRY');
    });

    it('VALID: {click RETRY} => invokes onRetry exactly once', async () => {
      const proxy = HealthErrorLayerWidgetProxy();
      const message = ErrorMessageStub();
      const retryCalls: unknown[] = [];

      mantineRenderAdapter({
        ui: (
          <HealthErrorLayerWidget
            message={message}
            onRetry={() => {
              retryCalls.push(true);
            }}
          />
        ),
      });

      await proxy.clickRetry();

      expect(retryCalls).toStrictEqual([true]);
    });
  });
});
