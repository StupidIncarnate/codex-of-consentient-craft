import { createRoot } from 'react-dom/client';

jest.mock('react-dom/client', () => ({
  ...jest.requireActual('react-dom/client'),
  createRoot: jest.fn(),
}));

export const reactDomMountAdapterProxy = (): {
  renderWasCalled: () => boolean;
} => {
  const renderMock = jest.fn();

  const mock = jest.mocked(createRoot);
  mock.mockReturnValue({
    render: renderMock,
    unmount: jest.fn(),
  } as unknown as ReturnType<typeof createRoot>);

  return {
    renderWasCalled: (): boolean => renderMock.mock.calls.length > 0,
  };
};
