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
    it('VALID: {flow measured by two tracks} => renders one QUEST_SUMMARY_TRACK_ROW per track, carrying that track real counts', () => {
      FlowRowLayerWidgetProxy();
      const flow = QuestSummaryFlowStub({
        id: 'login-flow',
        name: 'Login Flow',
        flowType: 'runtime',
        tracks: [
          QuestSummaryTrackCountsStub({
            id: 'flowrider',
            confirmed: 1,
            unconfirmable: 0,
            outstanding: 1,
          }),
          QuestSummaryTrackCountsStub({
            id: 'siegemaster',
            confirmed: 0,
            unconfirmable: 1,
            outstanding: 9,
          }),
        ],
      });

      mantineRenderAdapter({ ui: <FlowRowLayerWidget flow={flow} /> });

      const trackRows = screen.getAllByTestId('QUEST_SUMMARY_TRACK_ROW');

      expect(trackRows.map((row) => String(row.textContent))).toStrictEqual([
        'FLOWRIDER1 confirmed0 unconfirmable1 outstanding',
        'SIEGEMASTER0 confirmed1 unconfirmable9 outstanding',
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
