import { iconButtonSizeContract } from './icon-button-size-contract';
import type { IconButtonSize } from './icon-button-size-contract';

export const IconButtonSizeStub = ({ value }: { value?: string } = {}): IconButtonSize =>
  iconButtonSizeContract.parse(value ?? 'sm');
