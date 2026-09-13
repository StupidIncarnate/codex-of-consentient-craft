/**
 * PURPOSE: Renders one durable side-channel note's row in the verification summary — its summary
 * line and its role/detail line.
 *
 * USAGE:
 * <NoteRowLayerWidget note={note} />
 * // Renders QUEST_SUMMARY_NOTE_ROW with the note's summary and role/detail text
 */

import { Box, Text } from '@mantine/core';

import type { QuestNote } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const ROW_FONT_SIZE = 10;

export interface NoteRowLayerWidgetProps {
  note: QuestNote;
}

export const NoteRowLayerWidget = ({ note }: NoteRowLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Box data-testid="QUEST_SUMMARY_NOTE_ROW">
      <Text
        ff="monospace"
        data-testid="QUEST_SUMMARY_NOTE_SUMMARY"
        style={{ fontSize: ROW_FONT_SIZE, color: colors.text }}
      >
        {note.summary}
      </Text>
      <Text
        ff="monospace"
        data-testid="QUEST_SUMMARY_NOTE_DETAIL"
        style={{ fontSize: ROW_FONT_SIZE, color: colors['text-dim'] }}
      >
        {note.role} — {note.detail}
      </Text>
    </Box>
  );
};
