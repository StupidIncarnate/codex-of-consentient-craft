import { OrchestrationFlow } from './orchestration-flow';

// The deep role-to-role handoff integration suite is sidelined under tmp/step17-sideline/
// because Step 16 retired pathseeker dispatch from the orchestration loop. The legacy spawn
// pipeline that suite drove is replaced by the `/dumpster-launch` model: `get-next-step`
// returns pathseeker work items directly and the user's interactive Claude session Task()s
// them in-process. The sidelined suite can be restored or its scenarios re-authored against
// the dispatch-loop model once the legacy spawn machinery is fully retired.

describe('OrchestrationFlow', () => {
  describe('export shape', () => {
    it('VALID: OrchestrationFlow => exports the expected callable surface', () => {
      expect(OrchestrationFlow).toStrictEqual({
        start: expect.any(Function),
        pause: expect.any(Function),
        resume: expect.any(Function),
        abandon: expect.any(Function),
        delete: expect.any(Function),
        getStatus: expect.any(Function),
        recoverActiveQuests: expect.any(Function),
        stopAll: expect.any(Function),
      });
    });
  });
});
