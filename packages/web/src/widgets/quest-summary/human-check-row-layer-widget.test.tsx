import {
  QuestIdStub,
  QuestNoteStub,
  QuestSummaryObservableStub,
} from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { HumanCheckRowLayerWidget } from './human-check-row-layer-widget';
import { HumanCheckRowLayerWidgetProxy } from './human-check-row-layer-widget.proxy';

const QUEST_ID = QuestIdStub({ value: 'add-auth' });

describe('HumanCheckRowLayerWidget', () => {
  describe('an unjudged criterion', () => {
    it('VALID: {note: null} => renders the description and "no recording", never a fabricated link', () => {
      const proxy = HumanCheckRowLayerWidgetProxy();
      const criterion = QuestSummaryObservableStub({
        description: 'The dungeon-raid transition never stutters',
      });

      mantineRenderAdapter({
        ui: <HumanCheckRowLayerWidget questId={QUEST_ID} criterion={criterion} note={null} />,
      });

      expect(proxy.descriptionText()).toBe('The dungeon-raid transition never stutters');
      expect(proxy.evidenceText()).toBe('no recording');
    });

    it('VALID: {note: null} => renders a reason field and MET / NOT MET controls, no verdict line', () => {
      const proxy = HumanCheckRowLayerWidgetProxy();
      const criterion = QuestSummaryObservableStub();

      mantineRenderAdapter({
        ui: <HumanCheckRowLayerWidget questId={QUEST_ID} criterion={criterion} note={null} />,
      });

      expect(proxy.hasReasonField()).toBe(true);
      expect(proxy.verdictText()).toBe(null);
    });

    it('EMPTY: {reason: ""} => both MET and NOT MET start disabled', () => {
      const proxy = HumanCheckRowLayerWidgetProxy();
      const criterion = QuestSummaryObservableStub();

      mantineRenderAdapter({
        ui: <HumanCheckRowLayerWidget questId={QUEST_ID} criterion={criterion} note={null} />,
      });

      expect(proxy.isMetDisabled()).toBe(true);
      expect(proxy.isNotMetDisabled()).toBe(true);
    });

    it('VALID: {reason typed} => MET and NOT MET both become enabled', async () => {
      const proxy = HumanCheckRowLayerWidgetProxy();
      const criterion = QuestSummaryObservableStub();

      mantineRenderAdapter({
        ui: <HumanCheckRowLayerWidget questId={QUEST_ID} criterion={criterion} note={null} />,
      });

      await proxy.typeReason({ text: 'Watched it end to end.' });

      expect(proxy.isMetDisabled()).toBe(false);
      expect(proxy.isNotMetDisabled()).toBe(false);
    });

    it('VALID: {click MET} => calls the broker with the observable id, outcome met, and the typed reason', async () => {
      const proxy = HumanCheckRowLayerWidgetProxy();
      const criterion = QuestSummaryObservableStub({ observableId: 'motion-feels-smooth' });
      proxy.setupRecorded();

      mantineRenderAdapter({
        ui: <HumanCheckRowLayerWidget questId={QUEST_ID} criterion={criterion} note={null} />,
      });

      await proxy.typeReason({ text: 'Watched it end to end.' });
      await proxy.clickMet();

      await expect(proxy.getRequestBodies()).resolves.toStrictEqual([
        { unitId: 'motion-feels-smooth', outcome: 'met', reason: 'Watched it end to end.' },
      ]);
    });

    it('VALID: {click NOT MET} => calls the broker with outcome not-met', async () => {
      const proxy = HumanCheckRowLayerWidgetProxy();
      const criterion = QuestSummaryObservableStub({ observableId: 'motion-feels-smooth' });
      proxy.setupRecorded();

      mantineRenderAdapter({
        ui: <HumanCheckRowLayerWidget questId={QUEST_ID} criterion={criterion} note={null} />,
      });

      await proxy.typeReason({ text: 'Visibly janky.' });
      await proxy.clickNotMet();

      await expect(proxy.getRequestBodies()).resolves.toStrictEqual([
        { unitId: 'motion-feels-smooth', outcome: 'not-met', reason: 'Visibly janky.' },
      ]);
    });

    it('ERROR: {broker refuses} => renders the server message and re-enables the controls', async () => {
      const proxy = HumanCheckRowLayerWidgetProxy();
      const criterion = QuestSummaryObservableStub({ observableId: 'motion-feels-smooth' });
      proxy.setupRefused({
        error: 'Observable "motion-feels-smooth" is not flagged verifyByHuman',
      });

      mantineRenderAdapter({
        ui: <HumanCheckRowLayerWidget questId={QUEST_ID} criterion={criterion} note={null} />,
      });

      await proxy.typeReason({ text: 'Watched it.' });
      await proxy.clickMet();

      expect(proxy.errorText()).toBe(
        'Observable "motion-feels-smooth" is not flagged verifyByHuman',
      );
      expect(proxy.isMetDisabled()).toBe(false);
    });
  });

  describe('a judged criterion', () => {
    it('VALID: {note with outcome: met} => renders the verdict, no reason field or controls', () => {
      const proxy = HumanCheckRowLayerWidgetProxy();
      const criterion = QuestSummaryObservableStub({ observableId: 'motion-feels-smooth' });
      const note = QuestNoteStub({
        kind: 'human-verdict',
        unitId: 'motion-feels-smooth',
        outcome: 'met',
        detail: 'Watched run_7/walk.webm end to end — the transition never stutters.',
      });

      mantineRenderAdapter({
        ui: <HumanCheckRowLayerWidget questId={QUEST_ID} criterion={criterion} note={note} />,
      });

      expect(proxy.verdictText()).toBe(
        '[met] Watched run_7/walk.webm end to end — the transition never stutters.',
      );
      expect(proxy.hasReasonField()).toBe(false);
    });

    it('VALID: {note with outcome: not-met} => renders the rejection verdict', () => {
      const proxy = HumanCheckRowLayerWidgetProxy();
      const criterion = QuestSummaryObservableStub({ observableId: 'motion-feels-smooth' });
      const note = QuestNoteStub({
        kind: 'human-verdict',
        unitId: 'motion-feels-smooth',
        outcome: 'not-met',
        detail: 'The panel jumps two pixels right before it settles — visibly janky.',
      });

      mantineRenderAdapter({
        ui: <HumanCheckRowLayerWidget questId={QUEST_ID} criterion={criterion} note={note} />,
      });

      expect(proxy.verdictText()).toBe(
        '[not-met] The panel jumps two pixels right before it settles — visibly janky.',
      );
    });
  });
});
