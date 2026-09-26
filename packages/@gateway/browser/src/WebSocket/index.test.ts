import { connect } from './index';

describe('@dungeonmaster/browser/WebSocket', () => {
  it('VALID: {barrel} => re-exports every curated WebSocket function', () => {
    expect(connect).toStrictEqual(expect.any(Function));
  });
});
