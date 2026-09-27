import { connect } from './WebSocket';

describe('#gateway/browser/WebSocket', () => {
  it('VALID: {barrel} => re-exports every curated WebSocket function', () => {
    expect(connect).toStrictEqual(expect.any(Function));
  });
});
