import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorEventsOnAdapter } from './orchestrator-events-on-adapter';
import { orchestratorEventsOnAdapterProxy } from './orchestrator-events-on-adapter.proxy';

describe('orchestratorEventsOnAdapter', () => {
  describe('successful subscription', () => {
    it('VALID: {type, handler} => registers handler for event type', () => {
      const proxy = orchestratorEventsOnAdapterProxy();
      const handler = jest.fn();

      orchestratorEventsOnAdapter({ type: 'phase-change', handler });

      const captured = proxy.getCapturedHandler({ type: 'phase-change' });

      expect(captured).toBe(handler);
    });

    it('VALID: {handler invoked} => handler receives processId and payload', () => {
      const proxy = orchestratorEventsOnAdapterProxy();
      const handler = jest.fn();
      const processId = ProcessIdStub();

      orchestratorEventsOnAdapter({ type: 'slot-update', handler });

      const captured = proxy.getCapturedHandler({ type: 'slot-update' });
      captured?.({ processId, payload: { slotIndex: 0 } });

      expect(handler).toHaveBeenCalledWith({
        processId,
        payload: { slotIndex: 0 },
      });
    });
  });
});
