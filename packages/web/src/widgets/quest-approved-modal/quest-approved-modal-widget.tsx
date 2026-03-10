/**
 * PURPOSE: Displays a modal when a quest is approved, offering three choices: keep chatting, start new quest, or begin execution
 *
 * USAGE:
 * <QuestApprovedModalWidget opened={true} onKeepChatting={fn} onNewQuest={fn} onBeginQuest={fn} />
 * // Renders dungeon-themed modal with three action buttons
 */

import { Modal, Stack, Text } from '@mantine/core';

import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { ButtonVariant } from '../../contracts/button-variant/button-variant-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';

const KEEP_CHATTING_LABEL = 'Keep Chatting' as ButtonLabel;
const NEW_QUEST_LABEL = 'Start a new Quest' as ButtonLabel;
const BEGIN_QUEST_LABEL = 'Begin Quest' as ButtonLabel;
const GHOST_VARIANT = 'ghost' as ButtonVariant;

export interface QuestApprovedModalWidgetProps {
  opened: boolean;
  onKeepChatting: () => void;
  onNewQuest: () => void;
  onBeginQuest: () => void;
}

export const QuestApprovedModalWidget = ({
  opened,
  onKeepChatting,
  onNewQuest,
  onBeginQuest,
}: QuestApprovedModalWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Modal
      opened={opened}
      onClose={onKeepChatting}
      withCloseButton={false}
      closeOnClickOutside={false}
      centered
      styles={{
        content: {
          backgroundColor: colors['bg-surface'],
          border: `1px solid ${colors.border}`,
        },
        overlay: {
          backgroundColor: 'rgba(13, 9, 7, 0.85)',
        },
      }}
    >
      <Stack gap="lg" align="center" py="md">
        <Text
          ff="monospace"
          size="sm"
          fw={600}
          style={{ color: colors['loot-gold'], textAlign: 'center' }}
          data-testid="QUEST_APPROVED_MODAL_TITLE"
        >
          Shall we go dumpster diving for some code?
        </Text>

        <Stack gap="xs" w="100%">
          <PixelBtnWidget label={BEGIN_QUEST_LABEL} onClick={onBeginQuest} />
          <PixelBtnWidget
            label={KEEP_CHATTING_LABEL}
            variant={GHOST_VARIANT}
            onClick={onKeepChatting}
          />
          <PixelBtnWidget label={NEW_QUEST_LABEL} variant={GHOST_VARIANT} onClick={onNewQuest} />
        </Stack>
      </Stack>
    </Modal>
  );
};
