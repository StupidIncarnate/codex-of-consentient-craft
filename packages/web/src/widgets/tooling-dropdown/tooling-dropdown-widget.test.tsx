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

    it('VALID: {click while smoketest active} => navigates to active smoketest session', async () => {
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
              <Route path="/:guildSlug/session/:sessionId" element={<LocationProbe />} />
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

        expect(el.textContent).toBe('/smoketests-guild/session/sess-mcp');

        return el.textContent;
      });

      expect(finalLocation).toBe('/smoketests-guild/session/sess-mcp');
    });
  });
});
