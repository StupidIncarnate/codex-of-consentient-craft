import type { StubArgument } from '@dungeonmaster/shared/@types';

import { screenElementContract } from './screen-element-contract';
import type { ScreenElement } from './screen-element-contract';

export const ScreenElementStub = ({ ...props }: StubArgument<ScreenElement> = {}): ScreenElement =>
  screenElementContract.parse({
    type: 'text',
    content: 'Default content',
    ...props,
  });
