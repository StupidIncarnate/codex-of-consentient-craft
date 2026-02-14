import { themeSchemeNameContract } from './theme-scheme-name-contract';
import type { ThemeSchemeName } from './theme-scheme-name-contract';

export const ThemeSchemeNameStub = ({ value }: { value?: string } = {}): ThemeSchemeName =>
  themeSchemeNameContract.parse(value ?? 'Ember Depths');
