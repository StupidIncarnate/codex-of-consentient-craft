import { themeSchemeDescriptionContract } from './theme-scheme-description-contract';
import type { ThemeSchemeDescription } from './theme-scheme-description-contract';

export const ThemeSchemeDescriptionStub = ({
  value,
}: { value?: string } = {}): ThemeSchemeDescription =>
  themeSchemeDescriptionContract.parse(value ?? 'Dark volcanic caverns with ember accents');
