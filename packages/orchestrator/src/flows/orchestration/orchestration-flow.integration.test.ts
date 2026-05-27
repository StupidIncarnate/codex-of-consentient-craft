import { OrchestrationFlow } from './orchestration-flow';

// The deep role-to-role handoff integration suite is sidelined under tmp/step17-sideline/
// because Step 16 retired pathseeker dispatch from the orchestration loop. The legacy spawn
// pipeline that suite drove is being replaced by the `/dumpster-launch` model:
// `get-next-step` returns pathseeker work items directly and the user's interactive Claude
// session Task()s them in-process. The in-process equivalent for smoketests is
// `smoketestInProcessDriverBroker`. Once the legacy spawn machinery is fully retired the
// sidelined suite can be restored or its scenarios re-authored against the new driver.

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
