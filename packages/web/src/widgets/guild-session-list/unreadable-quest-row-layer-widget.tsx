/**
 * PURPOSE: Renders one quest folder whose quest.json failed to load, so the session list accounts
 * for every folder on disk even when its contents cannot be read.
 *
 * USAGE:
 * <UnreadableQuestRowLayerWidget skippedQuestFile={skippedQuestFile} />
 * // Renders the quest folder path, an UNREADABLE badge, and the load failure reason
 */

import { Box, Group } from '@mantine/core';

import type { SkippedQuestFile } from '@dungeonmaster/shared/contracts';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface UnreadableQuestRowLayerWidgetProps {
  skippedQuestFile: SkippedQuestFile;
}

const ITEM_FONT_SIZE = 12;
const STATUS_FONT_SIZE = 10;

export const UnreadableQuestRowLayerWidget = ({
  skippedQuestFile,
}: UnreadableQuestRowLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Box
      px="xs"
      py={3}
      data-testid="UNREADABLE_QUEST_ROW"
      style={{
        fontFamily: 'monospace',
        fontSize: ITEM_FONT_SIZE,
        color: colors.text,
        borderRadius: 2,
        borderLeft: `2px solid ${colors.danger}`,
        backgroundColor: colors['bg-raised'],
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Group gap={6} wrap="nowrap" justify="space-between">
        <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
          {`${skippedQuestFile.questFolder}/quest.json`}
        </span>
        <span
          style={{
            color: colors.danger,
            fontSize: STATUS_FONT_SIZE,
            flexShrink: 0,
          }}
        >
          UNREADABLE
        </span>
      </Group>
      <span
        style={{
          color: colors['text-dim'],
          fontSize: STATUS_FONT_SIZE,
          overflowWrap: 'anywhere',
        }}
      >
        {skippedQuestFile.reason}
      </span>
    </Box>
  );
};
