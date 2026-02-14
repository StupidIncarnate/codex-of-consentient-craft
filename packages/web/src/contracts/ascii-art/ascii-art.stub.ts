import { asciiArtContract } from './ascii-art-contract';
import type { AsciiArt } from './ascii-art-contract';

export const AsciiArtStub = ({ value }: { value?: string } = {}): AsciiArt =>
  asciiArtContract.parse(
    value ?? '\u2554\u2550\u2550\u2550\u2557\n\u2551 D \u2551\n\u255a\u2550\u2550\u2550\u255d',
  );
