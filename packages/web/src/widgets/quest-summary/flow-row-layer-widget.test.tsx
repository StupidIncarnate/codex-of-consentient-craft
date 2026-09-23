import { screen } from '@testing-library/react';

import { QuestSummaryFlowStub, QuestSummaryTrackCountsStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { FlowRowLayerWidget } from './flow-row-layer-widget';
import { FlowRowLayerWidgetProxy } from './flow-row-layer-widget.proxy';

describe('FlowRowLayerWidget', () => {
  describe('flow name', () => {
    it('VALID: {flow: Login Flow, flowType: runtime} => renders the name and flow type on one line', () => {
      FlowRowLayerWidgetProxy();
      const flow = QuestSummaryFlowStub({
        id: 'login-flow',
        name: 'Login Flow',
        flowType: 'runtime',
        tracks: [],
      });

      mantineRenderAdapter({ ui: <FlowRowLayerWidget flow={flow} /> });

      expect(screen.getByTestId('QUEST_SUMMARY_FLOW_NAME').textContent).toBe(
        'Login Flow [runtime]',
      );
    });
  });

  describe('track rows', () => {
    it('VALID: {flow measured by two tracks} => renders one QUEST_SUMMARY_TRACK_ROW per track, each carrying its own four counts', () => {
      FlowRowLayerWidgetProxy();
      const flow = QuestSummaryFlowStub({
        id: 'login-flow',
        name: 'Login Flow',
        flowType: 'runtime',
        tracks: [
          QuestSummaryTrackCountsStub({
            id: 'flowrider',
            met: 12,
            cantMeet: 1,
            unmet: 2,
            outstanding: 3,
          }),
          QuestSummaryTrackCountsStub({
            id: 'siegemaster',
            met: 0,
            cantMeet: 1,
            unmet: 4,
            outstanding: 9,
          }),
        ],
      });

      mantineRenderAdapter({ ui: <FlowRowLayerWidget flow={flow} /> });

      const trackRows = screen.getAllByTestId('QUEST_SUMMARY_TRACK_ROW');

      expect(trackRows.map((row) => String(row.textContent))).toStrictEqual([
        'FLOWRIDER12 met1 cant-meet2 unmet3 outstanding',
        'SIEGEMASTER0 met1 cant-meet4 unmet9 outstanding',
      ]);
    });

    it('VALID: {two tracks with different unmet and outstanding} => each row keeps its own two figures and never the sibling figures', () => {
      FlowRowLayerWidgetProxy();
      const flow = QuestSummaryFlowStub({
        id: 'login-flow',
        tracks: [
          QuestSummaryTrackCountsStub({
            id: 'flowrider',
            met: 0,
            cantMeet: 0,
            unmet: 2,
            outstanding: 3,
          }),
          QuestSummaryTrackCountsStub({
            id: 'siegemaster',
            met: 0,
            cantMeet: 0,
            unmet: 5,
            outstanding: 8,
          }),
        ],
      });

      mantineRenderAdapter({ ui: <FlowRowLayerWidget flow={flow} /> });

      expect(
        screen.getAllByTestId('QUEST_SUMMARY_TRACK_UNMET').map((cell) => String(cell.textContent)),
      ).toStrictEqual(['2 unmet', '5 unmet']);
      expect(
        screen
          .getAllByTestId('QUEST_SUMMARY_TRACK_OUTSTANDING')
          .map((cell) => String(cell.textContent)),
      ).toStrictEqual(['3 outstanding', '8 outstanding']);
    });

    it('VALID: {a track nobody has touched beside a fully met one} => the untouched row is all outstanding and the met row is all met', () => {
      FlowRowLayerWidgetProxy();
      const flow = QuestSummaryFlowStub({
        id: 'login-flow',
        tracks: [
          QuestSummaryTrackCountsStub({
            id: 'codeweaver',
            met: 6,
            cantMeet: 0,
            unmet: 0,
            outstanding: 0,
          }),
          QuestSummaryTrackCountsStub({
            id: 'siegemaster',
            met: 0,
            cantMeet: 0,
            unmet: 0,
            outstanding: 6,
          }),
        ],
      });

      mantineRenderAdapter({ ui: <FlowRowLayerWidget flow={flow} /> });

      const trackRows = screen.getAllByTestId('QUEST_SUMMARY_TRACK_ROW');

      expect(trackRows.map((row) => String(row.textContent))).toStrictEqual([
        'CODEWEAVER6 met0 cant-meet0 unmet0 outstanding',
        'SIEGEMASTER0 met0 cant-meet0 unmet6 outstanding',
      ]);
    });

    it('EMPTY: {flow.tracks: []} => renders no track rows', () => {
      FlowRowLayerWidgetProxy();
      const flow = QuestSummaryFlowStub({ id: 'login-flow', tracks: [] });

      mantineRenderAdapter({ ui: <FlowRowLayerWidget flow={flow} /> });

      expect(screen.queryAllByTestId('QUEST_SUMMARY_TRACK_ROW')).toStrictEqual([]);
    });
  });
});
