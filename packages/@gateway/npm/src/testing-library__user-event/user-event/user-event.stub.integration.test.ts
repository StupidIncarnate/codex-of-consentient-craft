/**
 * @jest-environment jsdom
 */
import { UserEventStub } from './user-event.stub';

describe('UserEventStub', () => {
  it('VALID: {} => a real UserEvent that actually types into a real input', async () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    const user = UserEventStub();

    await user.type(input, 'hello');

    expect(input.value).toBe('hello');
  });
});
