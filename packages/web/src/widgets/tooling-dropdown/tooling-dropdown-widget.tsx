/**
 * PURPOSE: Renders a Tooling icon button with Smoketests options (MCP, Signals, Orchestration); while a smoketest suite is the active queue head, the button spins and clicks navigate to that quest's workspace instead of opening the menu
 *
 * USAGE:
 * <ToolingDropdownWidget />
 * // Renders a 36px icon-button trigger that opens a Mantine Menu above it; while a smoketest quest is the active queue head, it becomes a spinning button that navigates to the active smoketest quest workspace
 */

import { Menu, UnstyledButton } from '@mantine/core';
import { IconLoader2, IconTool } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useQuestQueueBinding } from '../../bindings/use-quest-queue/use-quest-queue-binding';
import { useSmoketestRunBinding } from '../../bindings/use-smoketest-run/use-smoketest-run-binding';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const MENU_ITEM_FONT_SIZE = 12;
const BUTTON_SIZE = 36;
const ICON_SIZE = 20;
const DISABLED_OPACITY = 0.4;

export const ToolingDropdownWidget = (): React.JSX.Element => {
  const [opened, setOpened] = useState(false);
  const { colors } = emberDepthsThemeStatics;
  const navigate = useNavigate();
  const { activeEntry } = useQuestQueueBinding();
  const { run } = useSmoketestRunBinding();

  const isSmoketestActive =
    activeEntry !== null && activeEntry.questSource?.startsWith('smoketest-') === true;

  const buttonStyle = {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.text,
    backgroundColor: colors['bg-raised'],
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    cursor: 'pointer',
  } as const;

  const spinKeyframes = (
    <style>{`@keyframes tooling-spin { to { transform: rotate(360deg); } }`}</style>
  );

  if (isSmoketestActive) {
    const questHref = `/${activeEntry.guildSlug}/quest/${activeEntry.questId}`;
    return (
      <UnstyledButton
        data-testid="TOOLING_DROPDOWN_TRIGGER"
        aria-label="Tooling (open active smoketest)"
        title="Tooling (open active smoketest)"
        onClick={(): void => {
          const result: unknown = navigate(questHref);
          if (result instanceof Promise) {
            result.catch((navError: unknown) => {
              globalThis.console.error('[tooling-dropdown] navigate', navError);
            });
          }
        }}
        style={{ ...buttonStyle, opacity: DISABLED_OPACITY }}
      >
        <IconLoader2 size={ICON_SIZE} style={{ animation: 'tooling-spin 1s linear infinite' }} />
        {spinKeyframes}
      </UnstyledButton>
    );
  }

  return (
    <Menu opened={opened} onChange={setOpened} position="top-end" withinPortal shadow="md">
      <Menu.Target>
        <UnstyledButton
          data-testid="TOOLING_DROPDOWN_TRIGGER"
          aria-label="Tooling"
          title="Tooling"
          style={buttonStyle}
        >
          <IconTool size={ICON_SIZE} />
          {spinKeyframes}
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown
        style={{
          backgroundColor: colors['bg-raised'],
          border: `1px solid ${colors.border}`,
          fontFamily: 'monospace',
          fontSize: MENU_ITEM_FONT_SIZE,
        }}
      >
        <Menu.Label style={{ color: colors['text-dim'] }}>Smoketests</Menu.Label>
        <Menu.Item
          data-testid="TOOLING_SMOKETEST_MCP"
          onClick={(): void => {
            setOpened(false);
            run({ suite: 'mcp' })
              .then((first) => {
                if (first !== null) {
                  const result: unknown = navigate(`/${first.guildSlug}/quest/${first.questId}`);
                  if (result instanceof Promise) {
                    result.catch((navError: unknown) => {
                      globalThis.console.error('[tooling-dropdown] navigate after mcp', navError);
                    });
                  }
                }
              })
              .catch((error: unknown) => {
                globalThis.console.error('[tooling-dropdown]', error);
              });
          }}
        >
          MCP
        </Menu.Item>
        <Menu.Item
          data-testid="TOOLING_SMOKETEST_SIGNALS"
          onClick={(): void => {
            setOpened(false);
            run({ suite: 'signals' })
              .then((first) => {
                if (first !== null) {
                  const result: unknown = navigate(`/${first.guildSlug}/quest/${first.questId}`);
                  if (result instanceof Promise) {
                    result.catch((navError: unknown) => {
                      globalThis.console.error(
                        '[tooling-dropdown] navigate after signals',
                        navError,
                      );
                    });
                  }
                }
              })
              .catch((error: unknown) => {
                globalThis.console.error('[tooling-dropdown]', error);
              });
          }}
        >
          Signals
        </Menu.Item>
        <Menu.Item
          data-testid="TOOLING_SMOKETEST_ORCHESTRATION"
          onClick={(): void => {
            setOpened(false);
            run({ suite: 'orchestration' })
              .then((first) => {
                if (first !== null) {
                  const result: unknown = navigate(`/${first.guildSlug}/quest/${first.questId}`);
                  if (result instanceof Promise) {
                    result.catch((navError: unknown) => {
                      globalThis.console.error(
                        '[tooling-dropdown] navigate after orchestration',
                        navError,
                      );
                    });
                  }
                }
              })
              .catch((error: unknown) => {
                globalThis.console.error('[tooling-dropdown]', error);
              });
          }}
        >
          Orchestration
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
