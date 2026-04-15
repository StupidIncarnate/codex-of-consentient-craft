import {
  PlanningReviewReportStub,
  PlanningScopeClassificationStub,
  PlanningSurfaceReportStub,
  PlanningSynthesisStub,
  PlanningWalkFindingsStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { questGetPlanningNotesBroker } from './quest-get-planning-notes-broker';
import { questGetPlanningNotesBrokerProxy } from './quest-get-planning-notes-broker.proxy';

describe('questGetPlanningNotesBroker', () => {
  describe('full planningNotes (no section)', () => {
    it('VALID: {questId, fresh quest} => returns default empty planningNotes', async () => {
      const proxy = questGetPlanningNotesBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupQuestFound({ quest });

      const result = await questGetPlanningNotesBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
      });

      expect(result).toStrictEqual({ surfaceReports: [] });
    });

    it('VALID: {questId, fully populated planningNotes} => returns full object', async () => {
      const proxy = questGetPlanningNotesBrokerProxy();
      const scope = PlanningScopeClassificationStub();
      const surface = PlanningSurfaceReportStub();
      const synthesis = PlanningSynthesisStub();
      const walk = PlanningWalkFindingsStub();
      const review = PlanningReviewReportStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        planningNotes: {
          scopeClassification: scope,
          surfaceReports: [surface],
          synthesis,
          walkFindings: walk,
          reviewReport: review,
        },
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetPlanningNotesBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
      });

      expect(result).toStrictEqual({
        scopeClassification: scope,
        surfaceReports: [surface],
        synthesis,
        walkFindings: walk,
        reviewReport: review,
      });
    });
  });

  describe('section: scope', () => {
    it('VALID: {section: "scope", scope present} => returns scopeClassification', async () => {
      const proxy = questGetPlanningNotesBrokerProxy();
      const scope = PlanningScopeClassificationStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        planningNotes: { surfaceReports: [], scopeClassification: scope },
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetPlanningNotesBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        section: 'scope',
      });

      expect(result).toStrictEqual(scope);
    });

    it('VALID: {section: "scope", scope absent} => returns undefined', async () => {
      const proxy = questGetPlanningNotesBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupQuestFound({ quest });

      const result = await questGetPlanningNotesBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        section: 'scope',
      });

      expect(result).toBe(undefined);
    });
  });

  describe('section: surface', () => {
    it('VALID: {section: "surface", reports present} => returns surfaceReports array', async () => {
      const proxy = questGetPlanningNotesBrokerProxy();
      const surface = PlanningSurfaceReportStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        planningNotes: { surfaceReports: [surface] },
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetPlanningNotesBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        section: 'surface',
      });

      expect(result).toStrictEqual([surface]);
    });

    it('VALID: {section: "surface", fresh quest} => returns empty array', async () => {
      const proxy = questGetPlanningNotesBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupQuestFound({ quest });

      const result = await questGetPlanningNotesBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        section: 'surface',
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('section: synthesis', () => {
    it('VALID: {section: "synthesis"} => returns synthesis', async () => {
      const proxy = questGetPlanningNotesBrokerProxy();
      const synthesis = PlanningSynthesisStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        planningNotes: { surfaceReports: [], synthesis },
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetPlanningNotesBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        section: 'synthesis',
      });

      expect(result).toStrictEqual(synthesis);
    });

    it('VALID: {section: "synthesis", absent} => returns undefined', async () => {
      const proxy = questGetPlanningNotesBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupQuestFound({ quest });

      const result = await questGetPlanningNotesBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        section: 'synthesis',
      });

      expect(result).toBe(undefined);
    });
  });

  describe('section: walk', () => {
    it('VALID: {section: "walk"} => returns walkFindings', async () => {
      const proxy = questGetPlanningNotesBrokerProxy();
      const walk = PlanningWalkFindingsStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        planningNotes: { surfaceReports: [], walkFindings: walk },
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetPlanningNotesBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        section: 'walk',
      });

      expect(result).toStrictEqual(walk);
    });

    it('VALID: {section: "walk", absent} => returns undefined', async () => {
      const proxy = questGetPlanningNotesBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupQuestFound({ quest });

      const result = await questGetPlanningNotesBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        section: 'walk',
      });

      expect(result).toBe(undefined);
    });
  });

  describe('section: review', () => {
    it('VALID: {section: "review"} => returns reviewReport', async () => {
      const proxy = questGetPlanningNotesBrokerProxy();
      const review = PlanningReviewReportStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        planningNotes: { surfaceReports: [], reviewReport: review },
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetPlanningNotesBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        section: 'review',
      });

      expect(result).toStrictEqual(review);
    });

    it('VALID: {section: "review", absent} => returns undefined', async () => {
      const proxy = questGetPlanningNotesBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupQuestFound({ quest });

      const result = await questGetPlanningNotesBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        section: 'review',
      });

      expect(result).toBe(undefined);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {questId not exists} => throws not found error', async () => {
      const proxy = questGetPlanningNotesBrokerProxy();
      proxy.setupQuestNotFound();

      await expect(
        questGetPlanningNotesBroker({ questId: QuestIdStub({ value: 'nonexistent' }) }),
      ).rejects.toThrow(/Quest with id "nonexistent" not found/u);
    });
  });
});
