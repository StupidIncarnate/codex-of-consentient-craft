import { screen } from '@testing-library/react';

import { QuestNoteStub, QuestSummaryNoteGroupStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { NoteGroupLayerWidget } from './note-group-layer-widget';
import { NoteGroupLayerWidgetProxy } from './note-group-layer-widget.proxy';

describe('NoteGroupLayerWidget', () => {
  describe('group title', () => {
    it('VALID: {group: open-question with one note} => renders the uppercased id with the note count', () => {
      NoteGroupLayerWidgetProxy();
      const group = QuestSummaryNoteGroupStub({
        id: 'open-question',
        notes: [QuestNoteStub()],
      });

      mantineRenderAdapter({ ui: <NoteGroupLayerWidget group={group} /> });

      expect(screen.getByTestId('QUEST_SUMMARY_NOTE_GROUP_TITLE').textContent).toBe(
        'OPEN-QUESTION (1)',
      );
    });

    it('EMPTY: {group: walk-reset with no notes} => renders the count as 0 and no note rows', () => {
      NoteGroupLayerWidgetProxy();
      const group = QuestSummaryNoteGroupStub({ id: 'walk-reset', notes: [] });

      mantineRenderAdapter({ ui: <NoteGroupLayerWidget group={group} /> });

      expect(screen.getByTestId('QUEST_SUMMARY_NOTE_GROUP_TITLE').textContent).toBe(
        'WALK-RESET (0)',
      );
      expect(screen.queryAllByTestId('QUEST_SUMMARY_NOTE_ROW')).toStrictEqual([]);
    });
  });

  describe('note rows', () => {
    it('VALID: {group with two notes} => renders one QUEST_SUMMARY_NOTE_ROW per note, in order', () => {
      NoteGroupLayerWidgetProxy();
      const group = QuestSummaryNoteGroupStub({
        id: 'open-question',
        notes: [
          QuestNoteStub({
            id: 'open-question-anchor-scope',
            summary: 'Should a stale anchor notify per box or once per batch?',
            detail: 'The batch send drops boxes whose node id no longer exists in the flow.',
            role: 'siegemaster',
          }),
          QuestNoteStub({
            id: 'open-question-second',
            summary: 'Does the queue bar need a per-flow badge?',
            detail: 'Nobody asked before the walk ended.',
            role: 'flowrider',
          }),
        ],
      });

      mantineRenderAdapter({ ui: <NoteGroupLayerWidget group={group} /> });

      expect(
        screen.getAllByTestId('QUEST_SUMMARY_NOTE_ROW').map((row) => String(row.textContent)),
      ).toStrictEqual([
        'Should a stale anchor notify per box or once per batch?siegemaster — The batch send drops boxes whose node id no longer exists in the flow.',
        'Does the queue bar need a per-flow badge?flowrider — Nobody asked before the walk ended.',
      ]);
    });
  });
});
