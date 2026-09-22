import { screen } from '@testing-library/react';

import { QuestSummaryTrackCountsStub } from '@dungeonmaster/shared/contracts';
import { verificationTracksStatics } from '@dungeonmaster/shared/statics';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { TrackRowLayerWidget } from './track-row-layer-widget';
import { TrackRowLayerWidgetProxy } from './track-row-layer-widget.proxy';

describe('TrackRowLayerWidget', () => {
  describe('the four counts', () => {
    it('VALID: {met: 12, cantMeet: 1, unmet: 2, outstanding: 3} => renders each of the four counts under its own testid', () => {
      TrackRowLayerWidgetProxy();
      const track = QuestSummaryTrackCountsStub({
        id: 'flowrider',
        met: 12,
        cantMeet: 1,
        unmet: 2,
        outstanding: 3,
      });

      mantineRenderAdapter({ ui: <TrackRowLayerWidget track={track} /> });

      expect(screen.getByTestId('QUEST_SUMMARY_TRACK_MET').textContent).toBe('12 met');
      expect(screen.getByTestId('QUEST_SUMMARY_TRACK_CANT_MEET').textContent).toBe('1 cant-meet');
      expect(screen.getByTestId('QUEST_SUMMARY_TRACK_UNMET').textContent).toBe('2 unmet');
      expect(screen.getByTestId('QUEST_SUMMARY_TRACK_OUTSTANDING').textContent).toBe(
        '3 outstanding',
      );
    });

    it('VALID: {met: 12, cantMeet: 1, unmet: 2, outstanding: 3} => the row reads name then all four counts in order', () => {
      TrackRowLayerWidgetProxy();
      const track = QuestSummaryTrackCountsStub({
        id: 'flowrider',
        met: 12,
        cantMeet: 1,
        unmet: 2,
        outstanding: 3,
      });

      mantineRenderAdapter({ ui: <TrackRowLayerWidget track={track} /> });

      expect(screen.getByTestId('QUEST_SUMMARY_TRACK_ROW').textContent).toBe(
        'FLOWRIDER12 met1 cant-meet2 unmet3 outstanding',
      );
    });

    it('VALID: {met: 8, cantMeet: 0, unmet: 0, outstanding: 0} => every unit reads met and the other three read 0', () => {
      TrackRowLayerWidgetProxy();
      const track = QuestSummaryTrackCountsStub({
        id: 'codeweaver',
        met: 8,
        cantMeet: 0,
        unmet: 0,
        outstanding: 0,
      });

      mantineRenderAdapter({ ui: <TrackRowLayerWidget track={track} /> });

      expect(screen.getByTestId('QUEST_SUMMARY_TRACK_MET').textContent).toBe('8 met');
      expect(screen.getByTestId('QUEST_SUMMARY_TRACK_CANT_MEET').textContent).toBe('0 cant-meet');
      expect(screen.getByTestId('QUEST_SUMMARY_TRACK_UNMET').textContent).toBe('0 unmet');
      expect(screen.getByTestId('QUEST_SUMMARY_TRACK_OUTSTANDING').textContent).toBe(
        '0 outstanding',
      );
    });

    it('EMPTY: {met: 0, cantMeet: 0, unmet: 0, outstanding: 7} => nobody looked, so outstanding carries all 7 and unmet reads 0', () => {
      TrackRowLayerWidgetProxy();
      const track = QuestSummaryTrackCountsStub({
        id: 'siegemaster',
        met: 0,
        cantMeet: 0,
        unmet: 0,
        outstanding: 7,
      });

      mantineRenderAdapter({ ui: <TrackRowLayerWidget track={track} /> });

      expect(screen.getByTestId('QUEST_SUMMARY_TRACK_UNMET').textContent).toBe('0 unmet');
      expect(screen.getByTestId('QUEST_SUMMARY_TRACK_OUTSTANDING').textContent).toBe(
        '7 outstanding',
      );
      expect(screen.getByTestId('QUEST_SUMMARY_TRACK_MET').textContent).toBe('0 met');
      expect(screen.getByTestId('QUEST_SUMMARY_TRACK_CANT_MEET').textContent).toBe('0 cant-meet');
    });

    it('VALID: {unmet: 4, outstanding: 0} => a session looked and left work open, so unmet carries all 4 and outstanding reads 0', () => {
      TrackRowLayerWidgetProxy();
      const track = QuestSummaryTrackCountsStub({
        id: 'siegemaster',
        met: 0,
        cantMeet: 0,
        unmet: 4,
        outstanding: 0,
      });

      mantineRenderAdapter({ ui: <TrackRowLayerWidget track={track} /> });

      expect(screen.getByTestId('QUEST_SUMMARY_TRACK_UNMET').textContent).toBe('4 unmet');
      expect(screen.getByTestId('QUEST_SUMMARY_TRACK_OUTSTANDING').textContent).toBe(
        '0 outstanding',
      );
    });
  });

  describe('unmet is never outstanding', () => {
    it('VALID: {unmet: 4, outstanding: 7} => the two render as separate elements carrying different figures and different labels', () => {
      TrackRowLayerWidgetProxy();
      const track = QuestSummaryTrackCountsStub({
        id: 'flowrider',
        met: 0,
        cantMeet: 0,
        unmet: 4,
        outstanding: 7,
      });

      mantineRenderAdapter({ ui: <TrackRowLayerWidget track={track} /> });

      const cells = Array.from(screen.getByTestId('QUEST_SUMMARY_TRACK_ROW').children);

      expect(cells.map((cell) => String(cell.getAttribute('data-testid')))).toStrictEqual([
        'QUEST_SUMMARY_TRACK_NAME',
        'QUEST_SUMMARY_TRACK_MET',
        'QUEST_SUMMARY_TRACK_CANT_MEET',
        'QUEST_SUMMARY_TRACK_UNMET',
        'QUEST_SUMMARY_TRACK_OUTSTANDING',
      ]);
      expect(cells.map((cell) => String(cell.textContent))).toStrictEqual([
        'FLOWRIDER',
        '0 met',
        '0 cant-meet',
        '4 unmet',
        '7 outstanding',
      ]);
    });

    it('VALID: {unmet: 4, outstanding: 7} => unmet is painted danger and outstanding text-dim, so the two read apart at a glance', () => {
      TrackRowLayerWidgetProxy();
      const track = QuestSummaryTrackCountsStub({
        id: 'flowrider',
        met: 0,
        cantMeet: 0,
        unmet: 4,
        outstanding: 7,
      });

      mantineRenderAdapter({ ui: <TrackRowLayerWidget track={track} /> });

      expect(screen.getByTestId('QUEST_SUMMARY_TRACK_UNMET').style.color).toBe('rgb(239, 68, 68)');
      expect(screen.getByTestId('QUEST_SUMMARY_TRACK_OUTSTANDING').style.color).toBe(
        'rgb(138, 114, 96)',
      );
    });
  });

  describe('track name', () => {
    it.each(verificationTracksStatics.roles)(
      'VALID: {id: %s} => renders that track id uppercased as the row name',
      (role) => {
        TrackRowLayerWidgetProxy();
        const track = QuestSummaryTrackCountsStub({ id: role });

        mantineRenderAdapter({ ui: <TrackRowLayerWidget track={track} /> });

        expect(screen.getByTestId('QUEST_SUMMARY_TRACK_NAME').textContent).toBe(role.toUpperCase());
      },
    );
  });
});
