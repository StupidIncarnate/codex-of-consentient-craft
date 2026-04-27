import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { QuestQueueEntryStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ToolingDropdownWidget } from './tooling-dropdown-widget';
import { ToolingDropdownWidgetProxy } from './tooling-dropdown-widget.proxy';

const LocationProbe = (): React.JSX.Element => {
  const location = useLocation();
  return <div data-testid="LOCATION">{location.pathname}</div>;
};

describe('ToolingDropdownWidget', () => {
  describe('idle state (no active smoketest)', () => {
    it('VALID: {queue empty} => renders the Tooling icon trigger', async () => {
      const proxy = ToolingDropdownWidgetProxy();
      proxy.queue.setupEntries({ entries: [] });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <ToolingDropdownWidget />
          </MemoryRouter>
        ),
      });

      const trigger = await findByTestId('TOOLING_DROPDOWN_TRIGGER');

      expect(trigger.getAttribute('aria-label')).toBe('Tooling');
    });

    it('VALID: {queue has non-smoketest head} => renders the Tooling icon trigger (menu mode)', async () => {
      const proxy = ToolingDropdownWidgetProxy();
      proxy.queue.setupEntries({
        entries: [QuestQueueEntryStub({ questId: 'q-user', questTitle: 'User Quest' })],
      });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <ToolingDropdownWidget />
          </MemoryRouter>
        ),
      });

      const trigger = await findByTestId('TOOLING_DROPDOWN_TRIGGER');

      expect(trigger.getAttribute('aria-label')).toBe('Tooling');
    });
  });

  describe('active smoketest state', () => {
    it('VALID: {activeEntry has questSource smoketest-mcp} => renders the spinning navigate button after queue resolves', async () => {
      const proxy = ToolingDropdownWidgetProxy();
      proxy.queue.setupEntries({
        entries: [
          QuestQueueEntryStub({
            questId: 'q-mcp',
            questTitle: 'Smoketest: MCP',
            questSource: 'smoketest-mcp',
            activeSessionId: SessionIdStub({ value: 'sess-mcp' }),
            guildSlug: 'smoketests-guild' as never,
          }),
        ],
      });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <ToolingDropdownWidget />
          </MemoryRouter>
        ),
      });

      const label = await waitFor(async () => {
        const trigger = await findByTestId('TOOLING_DROPDOWN_TRIGGER');
        const attr = trigger.getAttribute('aria-label');

        expect(attr).toBe('Tooling (open active smoketest)');

        return attr;
      });

      expect(label).toBe('Tooling (open active smoketest)');
    });

    it('VALID: {menu item click, run() resolves with first enqueued entry} => navigates to /:guildSlug/quest/:questId from binding return', async () => {
      const proxy = ToolingDropdownWidgetProxy();
      proxy.queue.setupEntries({ entries: [] });
      proxy.smoketest.setupSuccess({
        enqueued: [
          {
            questId: 'q-test-123' as never,
            guildSlug: 'smoketests' as never,
          },
        ],
      });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <ToolingDropdownWidget />
                    <LocationProbe />
                  </>
                }
              />
              <Route path="/:guildSlug/quest/:questId" element={<LocationProbe />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      const trigger = await findByTestId('TOOLING_DROPDOWN_TRIGGER');
      await userEvent.click(trigger);

      const signalsItem = await findByTestId('TOOLING_SMOKETEST_SIGNALS');
      await userEvent.click(signalsItem);

      const finalLocation = await waitFor(async () => {
        const el = await findByTestId('LOCATION');

        expect(el.textContent).toBe('/smoketests/quest/q-test-123');

        return el.textContent;
      });

      expect(finalLocation).toBe('/smoketests/quest/q-test-123');
    });

    it('EDGE: {menu item click, run() resolves with no enqueued entries} => navigate is not called', async () => {
      const proxy = ToolingDropdownWidgetProxy();
      proxy.queue.setupEntries({ entries: [] });
      proxy.smoketest.setupSuccess({ enqueued: [] });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/start']}>
            <Routes>
              <Route
                path="/start"
                element={
                  <>
                    <ToolingDropdownWidget />
                    <LocationProbe />
                  </>
                }
              />
              <Route path="/:guildSlug/quest/:questId" element={<LocationProbe />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      const trigger = await findByTestId('TOOLING_DROPDOWN_TRIGGER');
      await userEvent.click(trigger);

      const mcpItem = await findByTestId('TOOLING_SMOKETEST_MCP');
      await userEvent.click(mcpItem);

      await waitFor(async () => {
        const el = await findByTestId('LOCATION');

        expect(el.textContent).toBe('/start');
      });

      const finalLocation = await findByTestId('LOCATION');

      expect(finalLocation.textContent).toBe('/start');
    });

    it('VALID: {click while smoketest active} => navigates to active smoketest quest', async () => {
      const proxy = ToolingDropdownWidgetProxy();
      proxy.queue.setupEntries({
        entries: [
          QuestQueueEntryStub({
            questId: 'q-mcp',
            questTitle: 'Smoketest: MCP',
            questSource: 'smoketest-mcp',
            activeSessionId: SessionIdStub({ value: 'sess-mcp' }),
            guildSlug: 'smoketests-guild' as never,
          }),
        ],
      });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <ToolingDropdownWidget />
                    <LocationProbe />
                  </>
                }
              />
              <Route path="/:guildSlug/quest/:questId" element={<LocationProbe />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      await waitFor(async () => {
        const trigger = await findByTestId('TOOLING_DROPDOWN_TRIGGER');

        expect(trigger.getAttribute('aria-label')).toBe('Tooling (open active smoketest)');
      });

      const trigger = await findByTestId('TOOLING_DROPDOWN_TRIGGER');
      await userEvent.click(trigger);

      const finalLocation = await waitFor(async () => {
        const el = await findByTestId('LOCATION');

        expect(el.textContent).toBe('/smoketests-guild/quest/q-mcp');

        return el.textContent;
      });

      expect(finalLocation).toBe('/smoketests-guild/quest/q-mcp');
    });
  });
});
