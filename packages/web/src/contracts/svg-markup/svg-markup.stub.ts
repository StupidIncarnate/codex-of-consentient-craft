import { svgMarkupContract } from './svg-markup-contract';
import type { SvgMarkup } from './svg-markup-contract';

export const SvgMarkupStub = ({ value }: { value?: string } = {}): SvgMarkup =>
  svgMarkupContract.parse(value ?? '<svg><text>stub diagram</text></svg>');
