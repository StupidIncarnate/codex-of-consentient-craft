/**
 * PURPOSE: Mounts the REAL composed `AppFlow` route tree at a given path — no hand-written route
 * table — so a flow-level integration test can prove what the shipped router actually renders at a
 * URL instead of a stand-in that could drift from it. Stages only the HTTP calls the app shell's own
 * bindings issue on mount (queue, rate-limits, health); nothing else is allowed to be unhandled
 * under MSW's `onUnhandledRequest: 'error'`.
 *
 * USAGE:
 * const harness = appRouteTreeHarness();
 * harness.mountAt({ path: '/health' });
 * harness.hasHealthPageInsideMapContainer(); // true
 */
import React from 'react';
import { screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { HealthSnapshotStub } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';

import { mantineRenderAdapter } from '../../../src/adapters/mantine/render/mantine-render-adapter';
import { AppFlow } from '../../../src/flows/app/app-flow';
import { webConfigStatics } from '../../../src/statics/web-config/web-config-statics';

export const appRouteTreeHarness = (): {
  mountAt: (params: { path: string }) => void;
  hasMapContainer: () => boolean;
  hasHealthPageInsideMapContainer: () => boolean;
  hasHealthPageAnywhere: () => boolean;
} => {
  const mountAt = ({ path }: { path: string }): void => {
    StartEndpointMock.listen({
      method: 'get',
      url: webConfigStatics.api.routes.questsQueue,
    }).resolves({ data: { entries: [] } });

    StartEndpointMock.listen({
      method: 'get',
      url: webConfigStatics.api.routes.rateLimits,
    }).resolves({ data: { snapshot: null } });

    StartEndpointMock.listen({
      method: 'get',
      url: webConfigStatics.api.routes.health,
    }).resolves({ data: HealthSnapshotStub() });

    mantineRenderAdapter({
      ui: React.createElement(
        MemoryRouter,
        { initialEntries: [path] },
        React.createElement(AppFlow),
      ),
    });
  };

  const hasMapContainer = (): boolean => screen.queryByTestId('APP_MAP_CONTAINER') !== null;

  const hasHealthPageInsideMapContainer = (): boolean => {
    const mapContainer = screen.queryByTestId('APP_MAP_CONTAINER');
    return mapContainer !== null && within(mapContainer).queryByTestId('HEALTH_PAGE') !== null;
  };

  const hasHealthPageAnywhere = (): boolean => screen.queryByTestId('HEALTH_PAGE') !== null;

  return {
    mountAt,
    hasMapContainer,
    hasHealthPageInsideMapContainer,
    hasHealthPageAnywhere,
  };
};
