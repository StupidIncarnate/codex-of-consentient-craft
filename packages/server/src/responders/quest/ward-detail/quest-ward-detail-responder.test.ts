import { QuestWardDetailResponderProxy } from './quest-ward-detail-responder.proxy';

const VALID_QUEST_ID = '11111111-1111-4111-8111-111111111111';
const VALID_WARD_RESULT_ID = '22222222-2222-4222-8222-222222222222';

describe('QuestWardDetailResponder', () => {
  describe('successful retrieval', () => {
    it('VALID: {questId + wardResultId, detail file present} => returns 200 with parsed detail', async () => {
      const proxy = QuestWardDetailResponderProxy();
      const { expectedDetail } = proxy.setupDetail();

      const result = await proxy.callResponder({
        params: { questId: VALID_QUEST_ID, wardResultId: VALID_WARD_RESULT_ID },
      });

      expect(result).toStrictEqual({ status: 200, data: expectedDetail });
    });
  });

  describe('detail file absent', () => {
    it('EDGE: {detail file missing} => returns 404 with error', async () => {
      const proxy = QuestWardDetailResponderProxy();
      proxy.setupNotFound();

      const result = await proxy.callResponder({
        params: { questId: VALID_QUEST_ID, wardResultId: VALID_WARD_RESULT_ID },
      });

      expect(result).toStrictEqual({
        status: 404,
        data: { error: 'ENOENT: no such file or directory' },
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400 with error', async () => {
      const proxy = QuestWardDetailResponderProxy();

      const result = await proxy.callResponder({ params: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId and wardResultId are required' },
      });
    });

    it('INVALID: {wardResultId not a uuid} => returns 400 with error', async () => {
      const proxy = QuestWardDetailResponderProxy();

      const result = await proxy.callResponder({
        params: { questId: VALID_QUEST_ID, wardResultId: 'not-a-uuid' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId and wardResultId are required' },
      });
    });
  });
});
