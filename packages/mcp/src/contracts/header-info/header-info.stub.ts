import { headerInfoContract } from './header-info-contract';
import type { HeaderInfo } from './header-info-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { LineIndexStub } from '../line-index/line-index.stub';
import { HeaderTextStub } from '../header-text/header-text.stub';

export const HeaderInfoStub = ({ ...props }: StubArgument<HeaderInfo> = {}): HeaderInfo =>
  headerInfoContract.parse({
    lineIndex: LineIndexStub({ value: 0 }),
    headerText: HeaderTextStub({ value: '## Default Header' }),
    ...props,
  });
