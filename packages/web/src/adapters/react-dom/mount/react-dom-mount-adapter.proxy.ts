import { createRoot } from 'react-dom/client';

import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

registerModuleMock({
  module: 'react-dom/client',
  factory: () => ({
    createRoot: jest.fn(),
  }),
});

export const reactDomMountAdapterProxy = (): {
  renderWasCalled: () => boolean;
} => {
  const renderMock = jest.fn();
  const renderHandle: MockHandle = registerMock({ fn: renderMock });
  // render() receives the full React element tree under test — there is no value here a proxy
  // built ahead of the test could predict or describe, so this is a genuine no-address case.
  renderHandle.calledWith([]).returns(undefined);

  const mock: MockHandle = registerMock({ fn: createRoot });
  // createRoot receives the live DOM element resolved from rootElementId — an object identity
  // this proxy can't predict, since the test creates/appends the element after this proxy is
  // constructed. There's nothing else to key the mocked root instance on.
  mock.calledWith([]).returns({
    render: renderMock,
    unmount: jest.fn(),
  } as unknown as ReturnType<typeof createRoot>);

  return {
    renderWasCalled: (): boolean => renderHandle.callsMatching([]).length > 0,
  };
};
