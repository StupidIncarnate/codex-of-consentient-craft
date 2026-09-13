import { screen } from '@testing-library/react';

import { QuestSummaryTrackCountsStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { TrackRowLayerWidget } from './track-row-layer-widget';
import { TrackRowLayerWidgetProxy } from './track-row-layer-widget.proxy';

describe('TrackRowLayerWidget', () => {
  describe('track counts', () => {
    it('VALID: {track: flowrider, confirmed: 1, unconfirmable: 0, outstanding: 1} => renders the uppercased id and the three counts', () => {
      TrackRowLayerWidgetProxy();
      const track = QuestSummaryTrackCountsStub({
        id: 'flowrider',
        confirmed: 1,
        unconfirmable: 0,
        outstanding: 1,
      });

      mantineRenderAdapter({ ui: <TrackRowLayerWidget track={track} /> });

      expect(screen.getByTestId('QUEST_SUMMARY_TRACK_ROW').textContent).toBe(
        'FLOWRIDER1 confirmed0 unconfirmable1 outstanding',
      );
    });

    it('VALID: {track: siegemaster, confirmed: 0, unconfirmable: 1, outstanding: 9} => renders the uppercased id and the three counts', () => {
      TrackRowLayerWidgetProxy();
      const track = QuestSummaryTrackCountsStub({
        id: 'siegemaster',
        confirmed: 0,
        unconfirmable: 1,
        outstanding: 9,
      });

      mantineRenderAdapter({ ui: <TrackRowLayerWidget track={track} /> });

      expect(screen.getByTestId('QUEST_SUMMARY_TRACK_ROW').textContent).toBe(
        'SIEGEMASTER0 confirmed1 unconfirmable9 outstanding',
      );
    });
  });
});
