import { headerTextContract } from './header-text-contract';
import type { HeaderText } from './header-text-contract';

export const HeaderTextStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'Proxy Architecture',
  },
): HeaderText => headerTextContract.parse(value);
