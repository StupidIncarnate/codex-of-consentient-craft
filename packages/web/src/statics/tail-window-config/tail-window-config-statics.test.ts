import { tailWindowConfigStatics } from './tail-window-config-statics';

describe('tailWindowConfigStatics', () => {
  it('VALID: {default} => exposes maxVisibleWhenCollapsed=2 + minVisibleWhenCollapsed=1', () => {
    expect(tailWindowConfigStatics).toStrictEqual({
      maxVisibleWhenCollapsed: 2,
      minVisibleWhenCollapsed: 1,
    });
  });
});
