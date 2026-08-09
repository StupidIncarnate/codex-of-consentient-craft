import { questResumeTriggerContract } from './quest-resume-trigger-contract';
import { QuestResumeTriggerStub } from './quest-resume-trigger.stub';

describe('questResumeTriggerContract', () => {
  describe('valid triggers', () => {
    it('VALID: {value: "orchestration-resume"} => parses the user RESUME trigger', () => {
      expect(
        questResumeTriggerContract.parse(QuestResumeTriggerStub({ value: 'orchestration-resume' })),
      ).toBe('orchestration-resume');
    });

    it('VALID: {value: "recover-guild-layer-responder"} => parses the startup-recovery trigger', () => {
      expect(
        questResumeTriggerContract.parse(
          QuestResumeTriggerStub({ value: 'recover-guild-layer-responder' }),
        ),
      ).toBe('recover-guild-layer-responder');
    });

    it('VALID: {no argument} => defaults to the dispatcher trigger', () => {
      expect(questResumeTriggerContract.parse(QuestResumeTriggerStub())).toBe('dispatch-scan');
    });
  });

  describe('the closed set of pickup surfaces', () => {
    // A quest is picked back up exactly three ways, and every one of them must restore a drifted
    // worktree before spawning into it. Pinning the complete option list is what makes a FOURTH
    // pickup surface a compile-and-test event rather than a silent omission.
    it('VALID: {contract options} => enumerates exactly the three pickup surfaces, in call order', () => {
      expect(questResumeTriggerContract.options).toStrictEqual([
        'orchestration-resume',
        'recover-guild-layer-responder',
        'dispatch-scan',
      ]);
    });
  });

  describe('invalid triggers', () => {
    it('INVALID: {value: "resume"} => throws for a name outside the union', () => {
      expect(() => questResumeTriggerContract.parse('resume')).toThrow(/invalid_enum_value/u);
    });

    it('EMPTY: {value: ""} => throws for an empty trigger name', () => {
      expect(() => questResumeTriggerContract.parse('')).toThrow(/invalid_enum_value/u);
    });
  });
});
