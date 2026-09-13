/**
 * PURPOSE: Renders one note-kind group's row in the verification summary — its title with the note
 * count, plus one NoteRowLayerWidget per note it carries.
 *
 * USAGE:
 * <NoteGroupLayerWidget group={group} />
 * // Renders QUEST_SUMMARY_NOTE_GROUP with the group's title and its note rows
 */

import { Box, Text } from '@mantine/core';

import type { QuestSummaryNoteGroup } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { NoteRowLayerWidget } from './note-row-layer-widget';

const ROW_FONT_SIZE = 10;
const ROW_GAP = 6;
const ROW_INDENT = 10;

export interface NoteGroupLayerWidgetProps {
  group: QuestSummaryNoteGroup;
}

export const NoteGroupLayerWidget = ({ group }: NoteGroupLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Box
      data-testid="QUEST_SUMMARY_NOTE_GROUP"
      style={{ paddingLeft: ROW_INDENT, marginTop: ROW_GAP }}
    >
      <Text
        ff="monospace"
        data-testid="QUEST_SUMMARY_NOTE_GROUP_TITLE"
        style={{ fontSize: ROW_FONT_SIZE, color: colors['loot-rare'], fontWeight: 600 }}
      >
        {group.id.toUpperCase()} ({group.notes.length})
      </Text>
      {group.notes.map((note) => (
        <NoteRowLayerWidget key={note.id} note={note} />
      ))}
    </Box>
  );
};
