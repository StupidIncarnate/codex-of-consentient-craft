import { waitFor } from '@testing-library/react';

import { HealthStatusPayloadStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { HealthBadgeWidget } from './health-badge-widget';
import { HealthBadgeWidgetProxy } from './health-badge-widget.proxy';

describe('HealthBadgeWidget', () => {
  describe('pending state', () => {
    it('VALID: {mount} => reads CHECKING before the seed resolves, then the seed result', async () => {
      const proxy = HealthBadgeWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupOnlineSeed({ uptimeSeconds: 11520 });

      mantineRenderAdapter({ ui: <HealthBadgeWidget /> });

      expect(proxy.hasBadgeText({ text: 'CHECKING' })).toBe(true);

      await waitFor(() => {
        expect(proxy.hasBadgeText({ text: 'ONLINE 3h 12m' })).toBe(true);
      });

      expect(proxy.hasBadgeText({ text: 'ONLINE 3h 12m' })).toBe(true);
    });
  });

  describe('online label', () => {
    it('VALID: {seed status ok, uptimeSeconds 11520} => reads exactly ONLINE 3h 12m', async () => {
      const proxy = HealthBadgeWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupOnlineSeed({ uptimeSeconds: 11520 });

      mantineRenderAdapter({ ui: <HealthBadgeWidget /> });

      await waitFor(() => {
        expect(proxy.hasBadgeText({ text: 'ONLINE 3h 12m' })).toBe(true);
      });

      expect(proxy.hasBadgeText({ text: 'ONLINE 3h 12m' })).toBe(true);
    });

    it('EDGE: {seed uptimeSeconds 90061} => reads exactly ONLINE 25h 1m, never a day unit', async () => {
      const proxy = HealthBadgeWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupOnlineSeed({ uptimeSeconds: 90061 });

      mantineRenderAdapter({ ui: <HealthBadgeWidget /> });

      await waitFor(() => {
        expect(proxy.hasBadgeText({ text: 'ONLINE 25h 1m' })).toBe(true);
      });

      expect(proxy.hasBadgeText({ text: 'ONLINE 25h 1m' })).toBe(true);
    });
  });

  describe('degraded label', () => {
    it('VALID: {seed status degraded} => reads exactly DEGRADED, with nothing appended', async () => {
      const proxy = HealthBadgeWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupDegradedSeed();

      mantineRenderAdapter({ ui: <HealthBadgeWidget /> });

      await waitFor(() => {
        expect(proxy.hasBadgeText({ text: 'DEGRADED' })).toBe(true);
      });

      expect(proxy.hasBadgeText({ text: 'DEGRADED' })).toBe(true);
    });
  });

  describe('offline label', () => {
    it('ERROR: {seed responds 500} => reads exactly OFFLINE', async () => {
      const proxy = HealthBadgeWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupServerError();

      mantineRenderAdapter({ ui: <HealthBadgeWidget /> });

      await waitFor(() => {
        expect(proxy.hasBadgeText({ text: 'OFFLINE' })).toBe(true);
      });

      expect(proxy.hasBadgeText({ text: 'OFFLINE' })).toBe(true);
    });

    it('ERROR: {seed never reaches the server} => reads exactly OFFLINE', async () => {
      const proxy = HealthBadgeWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupUnreachable();

      mantineRenderAdapter({ ui: <HealthBadgeWidget /> });

      await waitFor(() => {
        expect(proxy.hasBadgeText({ text: 'OFFLINE' })).toBe(true);
      });

      expect(proxy.hasBadgeText({ text: 'OFFLINE' })).toBe(true);
    });
  });

  describe('offline is clickable', () => {
    it('VALID: {offline} => is an enabled control whose click reaches retry', async () => {
      const proxy = HealthBadgeWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupServerError();

      mantineRenderAdapter({ ui: <HealthBadgeWidget /> });

      await waitFor(() => {
        expect(proxy.hasBadgeText({ text: 'OFFLINE' })).toBe(true);
      });

      expect(proxy.isBadgeEnabled()).toBe(true);
      expect(proxy.getRequestCount()).toBe(1);

      await proxy.clickBadge();

      await waitFor(() => {
        expect(proxy.getRequestCount()).toBe(2);
      });

      expect(proxy.getRequestCount()).toBe(2);
    });
  });

  describe('offline title', () => {
    it('ERROR: {seed never reaches the server} => title reads exactly "No response from server"', async () => {
      const proxy = HealthBadgeWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupUnreachable();

      mantineRenderAdapter({ ui: <HealthBadgeWidget /> });

      await waitFor(() => {
        expect(proxy.hasBadgeTitle({ text: 'No response from server' })).toBe(true);
      });

      expect(proxy.hasBadgeTitle({ text: 'No response from server' })).toBe(true);
    });

    it('ERROR: {seed responds 500} => title reads exactly "Server returned 500"', async () => {
      const proxy = HealthBadgeWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupServerError();

      mantineRenderAdapter({ ui: <HealthBadgeWidget /> });

      await waitFor(() => {
        expect(proxy.hasBadgeTitle({ text: 'Server returned 500' })).toBe(true);
      });

      expect(proxy.hasBadgeTitle({ text: 'Server returned 500' })).toBe(true);
    });

    it('EDGE: {30 seconds of heartbeat silence} => title reads exactly "No heartbeat for 30 seconds"', () => {
      const proxy = HealthBadgeWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupServerError();
      proxy.installSilenceClock();

      mantineRenderAdapter({ ui: <HealthBadgeWidget /> });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverHeartbeat({
            payload: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11520 }),
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          jest.advanceTimersByTime(30000);
        },
      });

      expect(proxy.hasBadgeText({ text: 'OFFLINE' })).toBe(true);

      proxy.restoreRealClock();

      expect(proxy.hasBadgeTitle({ text: 'No heartbeat for 30 seconds' })).toBe(true);
    });
  });

  describe('live heartbeats', () => {
    it('VALID: {heartbeats carrying 11520 then 11580} => text moves from ONLINE 3h 12m to ONLINE 3h 13m', async () => {
      const proxy = HealthBadgeWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupOnlineSeed({ uptimeSeconds: 11520 });

      mantineRenderAdapter({ ui: <HealthBadgeWidget /> });

      await waitFor(() => {
        expect(proxy.hasBadgeText({ text: 'ONLINE 3h 12m' })).toBe(true);
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverHeartbeat({
            payload: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11520 }),
          });
        },
      });

      expect(proxy.hasBadgeText({ text: 'ONLINE 3h 12m' })).toBe(true);

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverHeartbeat({
            payload: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11580 }),
          });
        },
      });

      expect(proxy.hasBadgeText({ text: 'ONLINE 3h 13m' })).toBe(true);
    });
  });

  describe('retry', () => {
    it('VALID: {click while offline} => issues one new seed request', async () => {
      const proxy = HealthBadgeWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupServerError();

      mantineRenderAdapter({ ui: <HealthBadgeWidget /> });

      await waitFor(() => {
        expect(proxy.hasBadgeText({ text: 'OFFLINE' })).toBe(true);
      });

      expect(proxy.getRequestCount()).toBe(1);

      await proxy.clickBadge();

      await waitFor(() => {
        expect(proxy.getRequestCount()).toBe(2);
      });

      expect(proxy.getRequestCount()).toBe(2);
    });

    it('VALID: {200 retry with status ok} => text changes from OFFLINE to ONLINE with its uptime', async () => {
      const proxy = HealthBadgeWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupServerError();

      mantineRenderAdapter({ ui: <HealthBadgeWidget /> });

      await waitFor(() => {
        expect(proxy.hasBadgeText({ text: 'OFFLINE' })).toBe(true);
      });

      proxy.setupOnlineSeed({ uptimeSeconds: 11520 });

      await proxy.clickBadge();

      await waitFor(() => {
        expect(proxy.hasBadgeText({ text: 'ONLINE 3h 12m' })).toBe(true);
      });

      expect(proxy.hasBadgeText({ text: 'ONLINE 3h 12m' })).toBe(true);
    });
  });
});
