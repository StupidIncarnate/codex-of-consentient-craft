import { isQuestSectionInStageGuard } from './is-quest-section-in-stage-guard';

describe('isQuestSectionInStageGuard', () => {
  it('VALID: {section: operations, stage: spec} => true, spec carries the ledger alongside the flows', () => {
    const result = isQuestSectionInStageGuard({ section: 'operations', stage: 'spec' });

    expect(result).toBe(true);
  });

  it('VALID: {section: planningNotes, stage: spec} => false, planningNotes is the one section spec omits', () => {
    const result = isQuestSectionInStageGuard({ section: 'planningNotes', stage: 'spec' });

    expect(result).toBe(false);
  });

  it('VALID: {section: flows, stage: implementation} => true, a plan is never served without its target', () => {
    const result = isQuestSectionInStageGuard({ section: 'flows', stage: 'implementation' });

    expect(result).toBe(true);
  });

  it('VALID: {section: flows, stage: spec} => true', () => {
    const result = isQuestSectionInStageGuard({ section: 'flows', stage: 'spec' });

    expect(result).toBe(true);
  });

  it('VALID: {section: operations, stage: planning} => true', () => {
    const result = isQuestSectionInStageGuard({ section: 'operations', stage: 'planning' });

    expect(result).toBe(true);
  });

  it('VALID: {section: flows, stage: planning} => false, planning does not carry flows', () => {
    const result = isQuestSectionInStageGuard({ section: 'flows', stage: 'planning' });

    expect(result).toBe(false);
  });

  it('VALID: {section: operations, stage: implementation} => true', () => {
    const result = isQuestSectionInStageGuard({ section: 'operations', stage: 'implementation' });

    expect(result).toBe(true);
  });

  it('EDGE: {section: operations, no stage} => true, an unstaged quest is unfiltered', () => {
    const result = isQuestSectionInStageGuard({ section: 'operations' });

    expect(result).toBe(true);
  });

  it('EDGE: {no section} => false', () => {
    const result = isQuestSectionInStageGuard({ stage: 'spec' });

    expect(result).toBe(false);
  });
});
