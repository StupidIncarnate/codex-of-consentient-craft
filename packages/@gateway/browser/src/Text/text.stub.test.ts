import { Text } from './Text';
import { TextStub } from './text.stub';

describe('TextStub', () => {
  it('VALID: {given fields} => a real Text carrying them', () => {
    const node = TextStub({ data: 'abc' });

    expect({ isText: node instanceof Text, data: node.data }).toStrictEqual({
      isText: true,
      data: 'abc',
    });
  });

  it('VALID: {} => the documented defaults', () => {
    const node = TextStub();

    expect(node.data).toBe('hello');
  });
});
