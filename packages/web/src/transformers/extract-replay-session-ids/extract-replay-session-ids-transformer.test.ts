import { ReplayHistoryMessageStub } from '../../contracts/replay-history-message/replay-history-message.stub';
import { extractReplaySessionIdsTransformer } from './extract-replay-session-ids-transformer';

describe('extractReplaySessionIdsTransformer', () => {
  it('VALID: {single replay-history message} => returns the sessionId', () => {
    const message = ReplayHistoryMessageStub();

    const result = extractReplaySessionIdsTransformer({ messages: [message] });

    expect(result).toStrictEqual(['9c4d8f1c-3e38-48c9-bdec-22b61883b473']);
  });

  it('VALID: {non-replay messages mixed in} => skips non-replay items', () => {
    const message = ReplayHistoryMessageStub();
    const result = extractReplaySessionIdsTransformer({
      messages: [message, { type: 'other' }, message],
    });

    expect(result).toStrictEqual([
      '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
      '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
    ]);
  });

  it('EMPTY: {empty messages} => returns empty array', () => {
    const result = extractReplaySessionIdsTransformer({ messages: [] });

    expect(result).toStrictEqual([]);
  });
});
