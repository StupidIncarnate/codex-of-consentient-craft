/**
 * PURPOSE: Renders a Tooling icon button with Smoketests options (MCP, Signals, Orchestration)
 *
 * USAGE:
 * <ToolingDropdownWidget onRun={(suite) => handle(suite)} running={isRunning} onReopen={reopen} />
 * // Renders a 36px icon-button trigger that opens a Mantine Menu above it; while running, becomes a plain reopen button
 */

import { Menu, UnstyledButton } from '@mantine/core';
import { IconLoader2, IconTool } from '@tabler/icons-react';
import { useState } from 'react';

import type { SmoketestSuite } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const MENU_ITEM_FONT_SIZE = 12;
const BUTTON_SIZE = 36;
const ICON_SIZE = 20;
const DISABLED_OPACITY = 0.4;

export const ToolingDropdownWidget = ({
  onRun,
  onReopen,
  running,
}: {
  onRun: (params: { suite: SmoketestSuite }) => void;
  onReopen?: () => void;
  running?: boolean;
}): React.JSX.Element => {
  const [opened, setOpened] = useState(false);
  const { colors } = emberDepthsThemeStatics;

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

  if (running === true) {
    return (
      <UnstyledButton
        data-testid="TOOLING_DROPDOWN_TRIGGER"
        aria-label="Tooling (reopen drawer)"
        title="Tooling (reopen drawer)"
        onClick={(): void => onReopen?.()}
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
            onRun({ suite: 'mcp' });
          }}
        >
          MCP
        </Menu.Item>
        <Menu.Item
          data-testid="TOOLING_SMOKETEST_SIGNALS"
          onClick={(): void => {
            setOpened(false);
            onRun({ suite: 'signals' });
          }}
        >
          Signals
        </Menu.Item>
        <Menu.Item
          data-testid="TOOLING_SMOKETEST_ORCHESTRATION"
          onClick={(): void => {
            setOpened(false);
            onRun({ suite: 'orchestration' });
          }}
        >
          Orchestration
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
