import { menuIndexContract } from './menu-index-contract';
import type { MenuIndex } from './menu-index-contract';

export const MenuIndexStub = ({ value }: { value: number } = { value: 0 }): MenuIndex =>
  menuIndexContract.parse(value);
