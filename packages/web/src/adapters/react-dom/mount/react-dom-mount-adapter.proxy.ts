import { createRoot } from 'react-dom/client';

import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

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

  const mock = registerMock({ fn: createRoot });
  mock.mockReturnValue({
    render: renderMock,
    unmount: jest.fn(),
  } as unknown as ReturnType<typeof createRoot>);

  return {
    renderWasCalled: (): boolean => renderMock.mock.calls.length > 0,
  };
};
