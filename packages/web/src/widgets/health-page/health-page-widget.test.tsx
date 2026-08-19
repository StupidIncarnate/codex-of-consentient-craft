import { screen } from '@testing-library/react';

import { HealthSnapshotStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';
import { healthPageRowsStatics } from '../../statics/health-page-rows/health-page-rows-statics';
import { HealthPageWidget } from './health-page-widget';
import { HealthPageWidgetProxy } from './health-page-widget.proxy';

describe('HealthPageWidget', () => {
  describe('rendering', () => {
    it('VALID: {} => renders the HEALTH_PAGE container', async () => {
      const proxy = HealthPageWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSnapshot({ snapshot: HealthSnapshotStub() });

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasTable()).toBe(true);
        },
      });

      expect(proxy.hasHealthPage()).toBe(true);
    });

    it("VALID: {} => renders the title text 'SERVER HEALTH'", async () => {
      const proxy = HealthPageWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSnapshot({ snapshot: HealthSnapshotStub() });

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasTable()).toBe(true);
        },
      });

      expect(proxy.getTitleText()).toBe('SERVER HEALTH');
    });

    it('VALID: {} => renders the container in monospace', async () => {
      const proxy = HealthPageWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSnapshot({ snapshot: HealthSnapshotStub() });

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasTable()).toBe(true);
        },
      });

      const container = screen.getByTestId('HEALTH_PAGE');

      expect(container.style.fontFamily).toBe('monospace');
    });
  });

  describe('initial fetch', () => {
    it('VALID: {mount} => issues exactly one GET /api/health across the whole app', async () => {
      const proxy = HealthPageWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSnapshot({ snapshot: HealthSnapshotStub() });

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasTable()).toBe(true);
        },
      });

      expect(proxy.getRequestCount()).toBe(1);
    });

    it('EMPTY: {first GET still in flight} => HEALTH_PAGE_LOADING is visible and neither table nor error panel is in the DOM', () => {
      const proxy = HealthPageWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSnapshot({ snapshot: HealthSnapshotStub() });

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      expect([proxy.isLoadingVisible(), proxy.hasTable(), proxy.hasErrorPanel()]).toStrictEqual([
        true,
        false,
        false,
      ]);
    });

    it('VALID: {200 snapshot} => all 7 fields reach the health page widget', async () => {
      const proxy = HealthPageWidgetProxy();
      proxy.setupConnectedChannel();
      const snapshot = HealthSnapshotStub();
      proxy.setupSnapshot({ snapshot });

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasTable()).toBe(true);
        },
      });

      const renderedValues = healthPageRowsStatics.rows.map(
        (row) => screen.getByTestId(row.valueTestId).textContent,
      );
      const expectedValues = healthPageRowsStatics.rows.map((row) => String(snapshot[row.field]));

      expect(renderedValues).toStrictEqual(expectedValues);
    });
  });

  describe('the three-way branch', () => {
    it('VALID: {200 snapshot} => HEALTH_PAGE_ERROR is absent while HEALTH_PAGE_TABLE is rendered', async () => {
      const proxy = HealthPageWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSnapshot({ snapshot: HealthSnapshotStub() });

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasTable()).toBe(true);
        },
      });

      expect(proxy.hasErrorPanel()).toBe(false);
    });

    it("ERROR: {500 from /api/health} => the page takes the error branch and HEALTH_PAGE_ERROR_STATUS renders 'HTTP 500'", async () => {
      const proxy = HealthPageWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupServerError();

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasErrorPanel()).toBe(true);
        },
      });

      expect([proxy.hasTable(), proxy.getErrorStatusText()]).toStrictEqual([false, 'HTTP 500']);
    });

    it('ERROR: {network error} => HEALTH_PAGE_ERROR is visible and HEALTH_PAGE_TABLE is absent', async () => {
      const proxy = HealthPageWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupNetworkError();

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasErrorPanel()).toBe(true);
        },
      });

      expect(proxy.hasTable()).toBe(false);
    });

    it('ERROR: {refused connection to /api/health} => the page drives to the error branch instead of staying blank', async () => {
      const proxy = HealthPageWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupNetworkError();

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasErrorPanel()).toBe(true);
        },
      });

      expect([proxy.isLoadingVisible(), proxy.hasTable()]).toStrictEqual([false, false]);
    });
  });

  describe('live tick', () => {
    it('VALID: {health-updated tick} => issues exactly one more GET /api/health across the whole app', async () => {
      const proxy = HealthPageWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSnapshot({ snapshot: HealthSnapshotStub() });

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasTable()).toBe(true);
        },
      });

      expect(proxy.getRequestCount()).toBe(1);

      proxy.setupSnapshot({ snapshot: HealthSnapshotStub({ uptimeSeconds: 900 }) });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'health-updated',
              payload: {},
              timestamp: '2026-05-05T13:00:00.000Z',
            }),
          });
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.getRequestCount()).toBe(2);
        },
      });

      expect(proxy.getRequestCount()).toBe(2);
    });

    it('VALID: {health-updated tick} => HEALTH_PAGE_ROW_UPTIME_SECONDS renders a strictly larger integer after the tick', async () => {
      const proxy = HealthPageWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSnapshot({ snapshot: HealthSnapshotStub({ uptimeSeconds: 745 }) });

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasTable()).toBe(true);
        },
      });

      const uptimeBeforeTick = proxy.getUptimeValue();

      proxy.setupSnapshot({ snapshot: HealthSnapshotStub({ uptimeSeconds: 900 }) });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'health-updated',
              payload: {},
              timestamp: '2026-05-05T13:00:00.000Z',
            }),
          });
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.getUptimeValue()).toBe(900);
        },
      });

      expect(proxy.getUptimeValue()).toBeGreaterThan(uptimeBeforeTick);
    });
  });

  describe('socket loss', () => {
    it('EDGE: {WebSocket close while mounted} => HEALTH_PAGE_TABLE is removed from the DOM within 1000ms', async () => {
      const proxy = HealthPageWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSnapshot({ snapshot: HealthSnapshotStub() });

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasTable()).toBe(true);
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.closeChannel();
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasTable()).toBe(false);
        },
      });

      expect(proxy.hasTable()).toBe(false);
    });

    it('EDGE: {WebSocket close while mounted} => HEALTH_PAGE_ERROR becomes visible within 1000ms', async () => {
      const proxy = HealthPageWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSnapshot({ snapshot: HealthSnapshotStub() });

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasTable()).toBe(true);
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.closeChannel();
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasErrorPanel()).toBe(true);
        },
      });

      expect(proxy.hasErrorPanel()).toBe(true);
    });
  });

  describe('retry', () => {
    it('VALID: {click RETRY} => issues exactly one more GET /api/health across the whole app', async () => {
      const proxy = HealthPageWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupNetworkError();

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasErrorPanel()).toBe(true);
        },
      });

      const requestCountBeforeRetry = proxy.getRequestCount();

      proxy.setupSnapshot({ snapshot: HealthSnapshotStub() });

      await proxy.clickRetry();

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.getRequestCount()).toBe(requestCountBeforeRetry + 1);
        },
      });

      expect(proxy.getRequestCount()).toBe(requestCountBeforeRetry + 1);
    });

    it('VALID: {retry returns 200 with a valid body} => HEALTH_PAGE_ERROR disappears and HEALTH_PAGE_TABLE appears', async () => {
      const proxy = HealthPageWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupNetworkError();

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasErrorPanel()).toBe(true);
        },
      });

      proxy.setupSnapshot({ snapshot: HealthSnapshotStub() });

      await proxy.clickRetry();

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasTable()).toBe(true);
        },
      });

      expect(proxy.hasErrorPanel()).toBe(false);
    });

    it('ERROR: {retry also fails} => HEALTH_PAGE_ERROR remains visible and HEALTH_PAGE_TABLE stays absent', async () => {
      const proxy = HealthPageWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupNetworkError();

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasErrorPanel()).toBe(true);
        },
      });

      const requestCountBeforeRetry = proxy.getRequestCount();
      proxy.setupNetworkError();

      await proxy.clickRetry();

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.getRequestCount()).toBe(requestCountBeforeRetry + 1);
        },
      });

      expect([proxy.hasErrorPanel(), proxy.hasTable()]).toStrictEqual([true, false]);
    });

    it('VALID: {retry after a socket-loss panel} => HEALTH_PAGE_ERROR disappears and HEALTH_PAGE_TABLE reappears without waiting on the socket', async () => {
      const proxy = HealthPageWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSnapshot({ snapshot: HealthSnapshotStub() });

      mantineRenderAdapter({ ui: <HealthPageWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasTable()).toBe(true);
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.closeChannel();
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasErrorPanel()).toBe(true);
        },
      });

      proxy.setupSnapshot({ snapshot: HealthSnapshotStub({ uptimeSeconds: 900 }) });

      await proxy.clickRetry();

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.hasTable()).toBe(true);
        },
      });

      expect(proxy.hasErrorPanel()).toBe(false);
    });
  });
});
