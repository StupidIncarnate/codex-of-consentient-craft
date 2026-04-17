import {
  PlanningBlightReportStub,
  PlanningReviewReportStub,
  PlanningScopeClassificationStub,
  PlanningSurfaceReportStub,
  PlanningSynthesisStub,
  PlanningWalkFindingsStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { QuestGetPlanningNotesResponderProxy } from './quest-get-planning-notes-responder.proxy';

describe('QuestGetPlanningNotesResponder', () => {
  describe('full planningNotes (no section)', () => {
    it('VALID: {questId, fresh quest} => returns success with default empty shape', async () => {
      const proxy = QuestGetPlanningNotesResponderProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: 'add-auth' });

      expect(result).toStrictEqual({
        success: true,
        data: { surfaceReports: [], blightReports: [] },
      });
    });

    it('VALID: {questId, populated planningNotes} => returns success with full object', async () => {
      const proxy = QuestGetPlanningNotesResponderProxy();
      const scope = PlanningScopeClassificationStub();
      const surface = PlanningSurfaceReportStub();
      const blight = PlanningBlightReportStub();
      const synthesis = PlanningSynthesisStub();
      const walk = PlanningWalkFindingsStub();
      const review = PlanningReviewReportStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        planningNotes: {
          scopeClassification: scope,
          surfaceReports: [surface],
          blightReports: [blight],
          synthesis,
          walkFindings: walk,
          reviewReport: review,
        },
      });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: 'add-auth' });

      expect(result).toStrictEqual({
        success: true,
        data: {
          scopeClassification: scope,
          surfaceReports: [surface],
          blightReports: [blight],
          synthesis,
          walkFindings: walk,
          reviewReport: review,
        },
      });
    });
  });

  describe('section filters', () => {
    it('VALID: {section: "scope"} => returns success with scopeClassification only', async () => {
      const proxy = QuestGetPlanningNotesResponderProxy();
      const scope = PlanningScopeClassificationStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        planningNotes: { surfaceReports: [], scopeClassification: scope },
      });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: 'add-auth', section: 'scope' });

      expect(result).toStrictEqual({ success: true, data: scope });
    });

    it('VALID: {section: "surface"} => returns success with surfaceReports array', async () => {
      const proxy = QuestGetPlanningNotesResponderProxy();
      const surface = PlanningSurfaceReportStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        planningNotes: { surfaceReports: [surface] },
      });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: 'add-auth', section: 'surface' });

      expect(result).toStrictEqual({ success: true, data: [surface] });
    });

    it('VALID: {section: "synthesis"} => returns success with synthesis', async () => {
      const proxy = QuestGetPlanningNotesResponderProxy();
      const synthesis = PlanningSynthesisStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        planningNotes: { surfaceReports: [], synthesis },
      });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: 'add-auth', section: 'synthesis' });

      expect(result).toStrictEqual({ success: true, data: synthesis });
    });

    it('VALID: {section: "walk"} => returns success with walkFindings', async () => {
      const proxy = QuestGetPlanningNotesResponderProxy();
      const walk = PlanningWalkFindingsStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        planningNotes: { surfaceReports: [], walkFindings: walk },
      });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: 'add-auth', section: 'walk' });

      expect(result).toStrictEqual({ success: true, data: walk });
    });

    it('VALID: {section: "review"} => returns success with reviewReport', async () => {
      const proxy = QuestGetPlanningNotesResponderProxy();
      const review = PlanningReviewReportStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        planningNotes: { surfaceReports: [], reviewReport: review },
      });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: 'add-auth', section: 'review' });

      expect(result).toStrictEqual({ success: true, data: review });
    });

    it('VALID: {section: "blight"} => returns success with blightReports array', async () => {
      const proxy = QuestGetPlanningNotesResponderProxy();
      const blight = PlanningBlightReportStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        planningNotes: { surfaceReports: [], blightReports: [blight] },
      });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: 'add-auth', section: 'blight' });

      expect(result).toStrictEqual({ success: true, data: [blight] });
    });

    it('VALID: {section: "scope", absent} => returns success with undefined data', async () => {
      const proxy = QuestGetPlanningNotesResponderProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: 'add-auth', section: 'scope' });

      expect(result).toStrictEqual({ success: true, data: undefined });
    });
  });

  describe('error handling', () => {
    it('ERROR: {questId not found} => returns success: false with error message', async () => {
      const proxy = QuestGetPlanningNotesResponderProxy();
      proxy.setupQuestNotFound();

      const result = await proxy.callResponder({ questId: 'nonexistent' });

      expect(result).toStrictEqual({
        success: false,
        error: 'Quest with id "nonexistent" not found in any guild',
      });
    });

    it('ERROR: {invalid questId empty string} => returns success: false with validation error', async () => {
      const proxy = QuestGetPlanningNotesResponderProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: '' });

      expect(result.success).toBe(false);
    });
  });
});
