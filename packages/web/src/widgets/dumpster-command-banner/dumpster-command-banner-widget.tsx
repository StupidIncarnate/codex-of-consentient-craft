/**
 * PURPOSE: Renders an instructional banner that displays a slash command (e.g. `/dumpster-launch`) with a copy-to-clipboard button. Surfaces on the execute view and on the no-questId placeholder route.
 *
 * USAGE:
 * <DumpsterCommandBannerWidget message={message} command={command} />
 * // Renders a bordered banner with the message text + a COPY button that writes the command string to the system clipboard via the clipboardWriteAdapter.
 */

import { useState } from 'react';

import { Box, Group, Text } from '@mantine/core';

import { clipboardWriteAdapter } from '../../adapters/clipboard/write/clipboard-write-adapter';
import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { ButtonVariant } from '../../contracts/button-variant/button-variant-contract';
import type { DisplayLabel } from '../../contracts/display-label/display-label-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';

const COPY_LABEL = 'COPY' as ButtonLabel;
const COPIED_LABEL = 'COPIED' as ButtonLabel;
const GHOST_VARIANT = 'ghost' as ButtonVariant;

export interface DumpsterCommandBannerWidgetProps {
  message: DisplayLabel;
  command: DisplayLabel;
}

export const DumpsterCommandBannerWidget = ({
  message,
  command,
}: DumpsterCommandBannerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const [copied, setCopied] = useState(false);

  return (
    <Box
      data-testid="DUMPSTER_COMMAND_BANNER"
      style={{
        border: `1px solid ${colors.border}`,
        backgroundColor: colors['bg-raised'],
        padding: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}
    >
      <Text ff="monospace" size="xs" style={{ color: colors['text-dim'], flex: 1 }}>
        {message}
      </Text>
      <Text
        ff="monospace"
        size="xs"
        fw={700}
        style={{ color: colors['loot-gold'] }}
        data-testid="DUMPSTER_COMMAND_BANNER_COMMAND"
      >
        {command}
      </Text>
      <Group gap="xs">
        <PixelBtnWidget
          label={copied ? COPIED_LABEL : COPY_LABEL}
          variant={GHOST_VARIANT}
          onClick={(): void => {
            clipboardWriteAdapter({ text: String(command) })
              .then(() => {
                setCopied(true);
              })
              .catch((copyError: unknown) => {
                globalThis.console.error('[dumpster-command-banner] copy failed', copyError);
              });
          }}
        />
      </Group>
    </Box>
  );
};
