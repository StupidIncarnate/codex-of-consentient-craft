import { isNativeError } from './is-native-error';
import { NativeErrorStub } from './native-error.stub';

describe('NativeErrorStub', () => {
  it('VALID: {} => builds a real Error carrying the default message', () => {
    const error = NativeErrorStub();

    expect({ message: error.message, isNative: isNativeError(error) }).toStrictEqual({
      message: 'boom',
      isNative: true,
    });
  });

  it('VALID: {message} => carries the given message', () => {
    const error = NativeErrorStub({ message: 'custom failure' });

    expect(error.message).toBe('custom failure');
  });
});
