import { spyOn } from './spy-on';

const target = { greet: (): string => 'real' };

describe('#gateway/npm/jest__globals spyOn', () => {
  it('VALID: {object, method} => intercepts calls through the real jest.spyOn', () => {
    const spy = spyOn({ object: target, method: 'greet' });
    spy.mockReturnValue('mocked');

    expect(target.greet()).toBe('mocked');
  });

  it('VALID: {a later test with no setup of its own} => the repo-wide auto-reset restored the real implementation', () => {
    expect(target.greet()).toBe('real');
  });
});
