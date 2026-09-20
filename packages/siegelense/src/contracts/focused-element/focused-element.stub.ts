import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { focusedElementContract } from './focused-element-contract';
import type { FocusedElement } from './focused-element-contract';

export const FocusedElementStub = ({
  ...props
}: StubArgument<FocusedElement> = {}): FocusedElement =>
  focusedElementContract.parse({
    tag: ContentTextStub({ value: 'input' }),
    testId: null,
    role: null,
    domId: null,
    text: null,
    ref: null,
    ...props,
  });
