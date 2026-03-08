import { QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { designProcessState } from '../../../state/design-process/design-process-state';
import { DesignStopResponderProxy } from './design-stop-responder.proxy';

describe('DesignStopResponder', () => {
  describe('successful stop', () => {
    it('VALID: {running process} => returns 200 with stopped true', () => {
      const proxy = DesignStopResponderProxy();
      const questId = QuestIdStub();
      const kill = jest.fn();
      const port = QuestStub({ designPort: 5042 as never }).designPort!;

      designProcessState.register({ questId, port, kill });

      const result = proxy.callResponder({ params: { questId } });

      expect(result).toStrictEqual({
        status: 200,
        data: { stopped: true },
      });
      expect(kill).toHaveBeenCalledTimes(1);
    });
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400', () => {
      const proxy = DesignStopResponderProxy();

      const result = proxy.callResponder({ params: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing questId} => returns 400', () => {
      const proxy = DesignStopResponderProxy();

      const result = proxy.callResponder({ params: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('INVALID: {no running process} => returns 404', () => {
      const proxy = DesignStopResponderProxy();
      const questId = QuestIdStub();

      const result = proxy.callResponder({ params: { questId } });

      expect(result).toStrictEqual({
        status: 404,
        data: { error: 'No running design sandbox for this quest' },
      });
    });
  });
});
