import { questResumeTriggerStatics } from './quest-resume-trigger-statics';

describe('questResumeTriggerStatics', () => {
  // A quest is picked back up exactly three ways, and every one of them must put a drifted
  // worktree back on the quest branch before an agent is spawned into it. Pinning the complete
  // tuple is what turns a FOURTH pickup surface into a failing test rather than a silent omission.
  it('VALID: exported value => lists exactly the three quest-pickup surfaces', () => {
    expect(questResumeTriggerStatics).toStrictEqual({
      triggers: ['orchestration-resume', 'recover-guild-layer-responder', 'dispatch-scan'],
    });
  });
});
