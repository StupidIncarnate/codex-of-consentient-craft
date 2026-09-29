import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestNoteStub } from '@dungeonmaster/shared/contracts/quest-note/quest-note.stub';
import { QuestSummaryObservableStub } from '@dungeonmaster/shared/contracts/quest-summary-observable/quest-summary-observable.stub';

import { mantineRenderMiddleware } from '@dungeonmaster/testing/middleware/mantine-render';
import { HumanCheckPanelLayerWidget } from './human-check-panel-layer-widget';
import { HumanCheckPanelLayerWidgetProxy } from './human-check-panel-layer-widget.proxy';

const QUEST_ID = QuestIdStub({ value: 'add-auth' });

describe('HumanCheckPanelLayerWidget', () => {
  describe('no verifyByHuman criteria', () => {
    it('EMPTY: {criteria: []} => renders no section at all', () => {
      const proxy = HumanCheckPanelLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <HumanCheckPanelLayerWidget questId={QUEST_ID} criteria={[]} notes={[]} />,
      });

      expect(proxy.hasSection()).toBe(false);
      expect(proxy.rowCount()).toBe(0);
    });
  });

  describe('criteria present', () => {
    it('VALID: {one criterion, no matching note} => renders the section with one unjudged row', () => {
      const proxy = HumanCheckPanelLayerWidgetProxy();
      const criterion = QuestSummaryObservableStub({
        observableId: 'motion-feels-smooth',
        description: 'The dungeon-raid transition never stutters',
      });

      mantineRenderMiddleware({
        ui: <HumanCheckPanelLayerWidget questId={QUEST_ID} criteria={[criterion]} notes={[]} />,
      });

      expect(proxy.hasSection()).toBe(true);
      expect(proxy.rowCount()).toBe(1);
      expect(
        proxy.hasReasonFieldFor({ description: 'The dungeon-raid transition never stutters' }),
      ).toBe(true);
    });

    it('VALID: {one criterion, matching human-verdict note} => renders that row judged', () => {
      const proxy = HumanCheckPanelLayerWidgetProxy();
      const criterion = QuestSummaryObservableStub({
        observableId: 'motion-feels-smooth',
        description: 'The dungeon-raid transition never stutters',
      });
      const note = QuestNoteStub({
        kind: 'human-verdict',
        unitId: 'motion-feels-smooth',
        outcome: 'met',
        detail: 'Watched it end to end.',
      });

      mantineRenderMiddleware({
        ui: <HumanCheckPanelLayerWidget questId={QUEST_ID} criteria={[criterion]} notes={[note]} />,
      });

      expect(
        proxy.verdictTextFor({ description: 'The dungeon-raid transition never stutters' }),
      ).toBe('[met] Watched it end to end.');
      expect(
        proxy.hasReasonFieldFor({ description: 'The dungeon-raid transition never stutters' }),
      ).toBe(false);
    });

    it('VALID: {two criteria, a note for only one} => each row matches its own note independently', () => {
      const proxy = HumanCheckPanelLayerWidgetProxy();
      const judgedCriterion = QuestSummaryObservableStub({
        observableId: 'motion-feels-smooth',
        description: 'The dungeon-raid transition never stutters',
      });
      const unjudgedCriterion = QuestSummaryObservableStub({
        id: 'login-flow:observable:renders-warning-banner',
        observableId: 'renders-warning-banner',
        description: 'A stale session renders the warning banner',
      });
      const note = QuestNoteStub({
        kind: 'human-verdict',
        unitId: 'motion-feels-smooth',
        outcome: 'not-met',
        detail: 'Visibly janky.',
      });

      mantineRenderMiddleware({
        ui: (
          <HumanCheckPanelLayerWidget
            questId={QUEST_ID}
            criteria={[judgedCriterion, unjudgedCriterion]}
            notes={[note]}
          />
        ),
      });

      expect(proxy.rowCount()).toBe(2);
      expect(
        proxy.verdictTextFor({ description: 'The dungeon-raid transition never stutters' }),
      ).toBe('[not-met] Visibly janky.');
      expect(
        proxy.hasReasonFieldFor({ description: 'A stale session renders the warning banner' }),
      ).toBe(true);
    });

    it("VALID: {click MET on the second of two rows} => calls the broker naming that row's own observable id", async () => {
      const proxy = HumanCheckPanelLayerWidgetProxy();
      const firstCriterion = QuestSummaryObservableStub({
        observableId: 'motion-feels-smooth',
        description: 'The dungeon-raid transition never stutters',
      });
      const secondCriterion = QuestSummaryObservableStub({
        id: 'login-flow:observable:renders-warning-banner',
        observableId: 'renders-warning-banner',
        description: 'A stale session renders the warning banner',
      });
      proxy.setupRecorded();

      mantineRenderMiddleware({
        ui: (
          <HumanCheckPanelLayerWidget
            questId={QUEST_ID}
            criteria={[firstCriterion, secondCriterion]}
            notes={[]}
          />
        ),
      });

      await proxy.typeReasonFor({
        description: 'A stale session renders the warning banner',
        text: 'Confirmed the banner appears.',
      });
      await proxy.clickMetFor({ description: 'A stale session renders the warning banner' });

      await expect(proxy.getRequestBodies()).resolves.toStrictEqual([
        {
          unitId: 'renders-warning-banner',
          outcome: 'met',
          reason: 'Confirmed the banner appears.',
        },
      ]);
    });
  });
});
