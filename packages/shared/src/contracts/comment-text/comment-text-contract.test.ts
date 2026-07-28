import { commentTextContract } from './comment-text-contract';
import { CommentTextStub } from './comment-text.stub';

describe('commentTextContract', () => {
  it('VALID: {value: sentence} => parses successfully', () => {
    const text = CommentTextStub({ value: 'This assertion looks wrong' });

    expect(text).toBe('This assertion looks wrong');
  });

  it('VALID: {default value} => uses default sentence', () => {
    const text = CommentTextStub();

    expect(text).toBe('This assertion looks wrong');
  });

  it('EMPTY: {value: ""} => throws validation error', () => {
    expect(() => {
      return commentTextContract.parse('');
    }).toThrow(/too_small/u);
  });

  it('EDGE: {value: single character} => parses successfully', () => {
    const text = CommentTextStub({ value: 'x' });

    expect(text).toBe('x');
  });
});
