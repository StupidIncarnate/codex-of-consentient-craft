/**
 * PURPOSE: Renders a quest title bar with title text and an optional ABANDON QUEST button with confirmation flow
 *
 * USAGE:
 * <QuestTitleBarWidget title={quest.title} onAbandon={handleAbandon} />
 * // Renders title on the left and ABANDON QUEST button on the right
 */

import { useState } from 'react';

import { Box, Group, Text } from '@mantine/core';

import type { Quest } from '@dungeonmaster/shared/contracts';

import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { ButtonVariant } from '../../contracts/button-variant/button-variant-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';

const ABANDON_LABEL = 'ABANDON QUEST' as ButtonLabel;
const CONFIRM_ABANDON_LABEL = 'CONFIRM ABANDON' as ButtonLabel;
const CANCEL_LABEL = 'CANCEL' as ButtonLabel;
const GHOST_VARIANT = 'ghost' as ButtonVariant;
const DANGER_VARIANT = 'danger' as ButtonVariant;

export interface QuestTitleBarWidgetProps {
  title: Quest['title'];
  onAbandon?: () => void;
}

export const QuestTitleBarWidget = ({
  title,
  onAbandon,
}: QuestTitleBarWidgetProps): React.JSX.Element => {
  const [confirmingAbandon, setConfirmingAbandon] = useState(false);
  const { colors } = emberDepthsThemeStatics;

  return (
    <Box
      data-testid="QUEST_TITLE_BAR"
      style={{
        padding: '8px 16px',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}
    >
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Text
          ff="monospace"
          size="xs"
          fw={600}
          style={{ color: colors['loot-gold'] }}
          data-testid="QUEST_TITLE"
        >
          {title}
        </Text>
      </Box>
      {onAbandon ? (
        <Group gap="xs" data-testid="ABANDON_BAR">
          {confirmingAbandon ? (
            <>
              <PixelBtnWidget
                label={CONFIRM_ABANDON_LABEL}
                variant={DANGER_VARIANT}
                onClick={() => {
                  setConfirmingAbandon(false);
                  onAbandon();
                }}
              />
              <PixelBtnWidget
                label={CANCEL_LABEL}
                variant={GHOST_VARIANT}
                onClick={() => {
                  setConfirmingAbandon(false);
                }}
              />
            </>
          ) : (
            <PixelBtnWidget
              label={ABANDON_LABEL}
              variant={GHOST_VARIANT}
              onClick={() => {
                setConfirmingAbandon(true);
              }}
            />
          )}
        </Group>
      ) : null}
    </Box>
  );
};
