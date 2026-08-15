import { QuestRiftcarverDetailResponderProxy } from './quest-riftcarver-detail-responder.proxy';

const VALID_QUEST_ID = '11111111-1111-4111-8111-111111111111';
const VALID_RIFTCARVER_RESULT_ID = '22222222-2222-4222-8222-222222222222';

describe('QuestRiftcarverDetailResponder', () => {
  describe('successful retrieval', () => {
    it('VALID: {questId + riftcarverResultId, log file present} => returns 200 with the plain-text log wrapped in a JSON envelope', async () => {
      const proxy = QuestRiftcarverDetailResponderProxy();
      const { expectedLog } = proxy.setupDetail();

      const result = await proxy.callResponder({
        params: { questId: VALID_QUEST_ID, riftcarverResultId: VALID_RIFTCARVER_RESULT_ID },
      });

      expect(result).toStrictEqual({ status: 200, data: { log: expectedLog } });
    });
  });

  describe('log file absent', () => {
    it('EDGE: {log file missing} => returns 404 with error', async () => {
      const proxy = QuestRiftcarverDetailResponderProxy();
      proxy.setupNotFound();

      const result = await proxy.callResponder({
        params: { questId: VALID_QUEST_ID, riftcarverResultId: VALID_RIFTCARVER_RESULT_ID },
      });

      expect(result).toStrictEqual({
        status: 404,
        data: { error: 'ENOENT: no such file or directory' },
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400 with error', async () => {
      const proxy = QuestRiftcarverDetailResponderProxy();

      const result = await proxy.callResponder({ params: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId and riftcarverResultId are required' },
      });
    });

    it('INVALID: {riftcarverResultId not a uuid} => returns 400 with error', async () => {
      const proxy = QuestRiftcarverDetailResponderProxy();

      const result = await proxy.callResponder({
        params: { questId: VALID_QUEST_ID, riftcarverResultId: 'not-a-uuid' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId and riftcarverResultId are required' },
      });
    });

    // The path-traversal refusal proven by BEHAVIOUR: no proxy setup is staged for this test, so
    // orchestratorFindQuestPathAdapter and fsReadFileAdapter have no configured response for ANY
    // call. If the responder read the params past validation and attempted to resolve or read a
    // file, the unconfigured mock would throw and this test would fail with that thrown error
    // instead of returning the expected 400 — proving zod's uuid check rejects the traversal
    // payload before any disk I/O is attempted.
    it('INVALID: {riftcarverResultId is a path-traversal payload} => returns 400 and reads no file', async () => {
      const proxy = QuestRiftcarverDetailResponderProxy();

      const result = await proxy.callResponder({
        params: { questId: VALID_QUEST_ID, riftcarverResultId: '../../etc/passwd' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId and riftcarverResultId are required' },
      });
    });
  });
});
