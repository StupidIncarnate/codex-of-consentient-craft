import { shortenedPathTextContract } from './shortened-path-text-contract';
import type { ShortenedPathText } from './shortened-path-text-contract';

export const ShortenedPathTextStub = ({ value }: { value?: string } = {}): ShortenedPathText =>
  shortenedPathTextContract.parse(value ?? 'web/…/tool-row-widget.tsx');
