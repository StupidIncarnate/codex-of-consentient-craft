import { MantineThemeStub } from './mantine-theme.stub';

describe('MantineThemeStub', () => {
  it('VALID: {} => a real theme override with the default primaryColor', () => {
    const theme = MantineThemeStub();

    expect(theme.primaryColor).toBe('blue');
  });

  it('VALID: {primaryColor} => reflects the given color', () => {
    const theme = MantineThemeStub({ primaryColor: 'red' });

    expect(theme.primaryColor).toBe('red');
  });
});
