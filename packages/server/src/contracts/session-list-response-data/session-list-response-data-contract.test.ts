import { sessionListResponseDataContract } from './session-list-response-data-contract';
import { SessionListResponseDataStub } from './session-list-response-data.stub';
import { SessionListItemStub } from '@dungeonmaster/shared/contracts/session-list-item/session-list-item.stub';

describe('sessionListResponseDataContract', () => {
  it('VALID: {default stub} => parses one session list item', () => {
    const result = SessionListResponseDataStub();

    expect(sessionListResponseDataContract.parse(result)).toStrictEqual([SessionListItemStub()]);
  });

  it('INVALID: {item missing startedAt} => throws validation error', () => {
    expect(() =>
      sessionListResponseDataContract.parse([
        { sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' },
      ]),
    ).toThrow(/received undefined/u);
  });
});
