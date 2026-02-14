import { themeColorTokenContract } from './theme-color-token-contract';
import type { ThemeColorToken } from './theme-color-token-contract';

export const ThemeColorTokenStub = ({ value }: { value?: string } = {}): ThemeColorToken =>
  themeColorTokenContract.parse(value ?? 'primary');
