import { screen } from '@testing-library/react';

import { QuestNoteStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { NoteRowLayerWidget } from './note-row-layer-widget';
import { NoteRowLayerWidgetProxy } from './note-row-layer-widget.proxy';

describe('NoteRowLayerWidget', () => {
  describe('note fields', () => {
    it('VALID: {note: summary, role, detail} => renders the summary line and the role/detail line', () => {
      NoteRowLayerWidgetProxy();
      const note = QuestNoteStub({
        id: 'open-question-anchor-scope',
        kind: 'open-question',
        role: 'siegemaster',
        summary: 'Should a stale anchor notify per box or once per batch?',
        detail: 'The batch send drops boxes whose node id no longer exists in the flow.',
      });

      mantineRenderAdapter({ ui: <NoteRowLayerWidget note={note} /> });

      expect(screen.getByTestId('QUEST_SUMMARY_NOTE_ROW').textContent).toBe(
        'Should a stale anchor notify per box or once per batch?siegemaster — The batch send drops boxes whose node id no longer exists in the flow.',
      );
    });
  });
});
