import { within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { HealthSnapshotStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { sadRaccoonPixelsStatics } from '../../statics/sad-raccoon-pixels/sad-raccoon-pixels-statics';
import { ServerHealthBadgeWidget } from './server-health-badge-widget';
import { ServerHealthBadgeWidgetProxy } from './server-health-badge-widget.proxy';

const SPRITE_SCALE = 2;

const expectedSadRaccoonBoxShadow = sadRaccoonPixelsStatics.pixels
  .map((p) => {
    const [xStr, yStr, color] = p.split(' ');
    const x = Number(xStr);
    const y = Number(yStr);
    return `${x * SPRITE_SCALE}px ${y * SPRITE_SCALE}px 0 0 ${color}`;
  })
  .join(',');

describe('ServerHealthBadgeWidget', () => {
  describe('online', () => {
    it('VALID: {uptimeSeconds: 745, version: 0.1.0} => badge is online with exact bracketed text', async () => {
      const proxy = ServerHealthBadgeWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSnapshot({ snapshot: HealthSnapshotStub() });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <ServerHealthBadgeWidget />
          </MemoryRouter>
        ),
      });

      const badge = await findByTestId('SERVER_HEALTH_BADGE');

      expect([badge.getAttribute('data-health-state'), badge.textContent]).toStrictEqual([
        'online',
        '[ ONLINE · 12m · v0.1.0 ]',
      ]);
    });

    it.each([
      [0, '0s'],
      [45, '45s'],
      [60, '1m'],
      [745, '12m'],
      [3600, '1h0m'],
      [3745, '1h2m'],
    ])(
      'VALID: {uptimeSeconds: %s} => badge text carries uptime token %s',
      async (seconds, token) => {
        const proxy = ServerHealthBadgeWidgetProxy();
        proxy.setupConnectedChannel();
        proxy.setupSnapshot({ snapshot: HealthSnapshotStub({ uptimeSeconds: seconds }) });

        const { findByTestId } = mantineRenderAdapter({
          ui: (
            <MemoryRouter>
              <ServerHealthBadgeWidget />
            </MemoryRouter>
          ),
        });

        const badge = await findByTestId('SERVER_HEALTH_BADGE');

        expect(badge.textContent).toBe(`[ ONLINE · ${token} · v0.1.0 ]`);
      },
    );
  });

  describe('offline', () => {
    it('ERROR: {network error} => badge is offline with exact text and a working /health link', async () => {
      const proxy = ServerHealthBadgeWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupNetworkError();

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <ServerHealthBadgeWidget />
          </MemoryRouter>
        ),
      });

      const badge = await findByTestId('SERVER_HEALTH_BADGE');
      const link = await findByTestId('SERVER_HEALTH_BADGE_LINK');

      expect([
        badge.getAttribute('data-health-state'),
        badge.textContent,
        link.getAttribute('href'),
      ]).toStrictEqual(['offline', '[ OFFLINE ]', '/health']);
    });

    it('INVALID: {200 body missing uptimeSeconds} => badge takes the offline branch', async () => {
      const proxy = ServerHealthBadgeWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupInvalidBody();

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <ServerHealthBadgeWidget />
          </MemoryRouter>
        ),
      });

      const badge = await findByTestId('SERVER_HEALTH_BADGE');
      const link = await findByTestId('SERVER_HEALTH_BADGE_LINK');

      expect([
        badge.getAttribute('data-health-state'),
        badge.textContent,
        link.getAttribute('href'),
      ]).toStrictEqual(['offline', '[ OFFLINE ]', '/health']);
    });

    it('VALID: {offline} => renders the sad-raccoon sprite at scale 2, built from sadRaccoonPixelsStatics', async () => {
      const proxy = ServerHealthBadgeWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupNetworkError();

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <ServerHealthBadgeWidget />
          </MemoryRouter>
        ),
      });

      const badge = await findByTestId('SERVER_HEALTH_BADGE');
      const sprite = within(badge).getByTestId('PIXEL_SPRITE');

      expect([sprite.style.boxShadow, sprite.style.width]).toStrictEqual([
        expectedSadRaccoonBoxShadow,
        '2px',
      ]);
    });
  });

  describe('live updates', () => {
    it('EDGE: {socket close after successful mount} => badge flips to offline in place', async () => {
      const proxy = ServerHealthBadgeWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSnapshot({ snapshot: HealthSnapshotStub() });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <ServerHealthBadgeWidget />
          </MemoryRouter>
        ),
      });

      const badgeBeforeClose = await findByTestId('SERVER_HEALTH_BADGE');

      expect(badgeBeforeClose.getAttribute('data-health-state')).toBe('online');

      testingLibraryActAdapter({
        callback: () => {
          proxy.closeChannel();
        },
      });

      const badgeAfterClose = await findByTestId('SERVER_HEALTH_BADGE');

      expect([
        badgeAfterClose.getAttribute('data-health-state'),
        badgeAfterClose === badgeBeforeClose,
      ]).toStrictEqual(['offline', true]);
    });

    it('VALID: {two health-updated ticks} => uptime token advances in place with no remount', async () => {
      const proxy = ServerHealthBadgeWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSnapshot({ snapshot: HealthSnapshotStub({ uptimeSeconds: 45 }) });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <ServerHealthBadgeWidget />
          </MemoryRouter>
        ),
      });

      const badgeBeforeTicks = await findByTestId('SERVER_HEALTH_BADGE');

      expect(badgeBeforeTicks.textContent).toBe('[ ONLINE · 45s · v0.1.0 ]');

      proxy.setupSnapshot({ snapshot: HealthSnapshotStub({ uptimeSeconds: 745 }) });
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

      const badgeAfterFirstTick = await findByTestId('SERVER_HEALTH_BADGE');

      expect([
        badgeAfterFirstTick.textContent,
        badgeAfterFirstTick === badgeBeforeTicks,
      ]).toStrictEqual(['[ ONLINE · 12m · v0.1.0 ]', true]);

      proxy.setupSnapshot({ snapshot: HealthSnapshotStub({ uptimeSeconds: 3745 }) });
      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'health-updated',
              payload: {},
              timestamp: '2026-05-05T13:00:05.000Z',
            }),
          });
        },
      });

      const badgeAfterSecondTick = await findByTestId('SERVER_HEALTH_BADGE');

      expect([
        badgeAfterSecondTick.textContent,
        badgeAfterSecondTick === badgeBeforeTicks,
      ]).toStrictEqual(['[ ONLINE · 1h2m · v0.1.0 ]', true]);

      // #check-no-page-reload-on-tick names performance.getEntriesByType('navigation'), which jsdom
      // does not populate meaningfully. Node identity across both ticks (asserted above) is the
      // falsifiable analogue available at this layer; the navigation-entry count itself is the
      // GROUNDSTOMPER's to assert in a real browser via *.e2e.ts.
    });
  });
});
