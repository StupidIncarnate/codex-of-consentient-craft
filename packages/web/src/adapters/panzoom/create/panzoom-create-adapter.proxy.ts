import Panzoom from '@panzoom/panzoom';

jest.mock('@panzoom/panzoom');

export const panzoomCreateAdapterProxy = (): {
  getInstance: () => {
    zoomIn: jest.Mock;
    zoomOut: jest.Mock;
    reset: jest.Mock;
    destroy: jest.Mock;
  };
  getConstructor: () => jest.Mock;
} => {
  const mockInstance = {
    zoomIn: jest.fn(),
    zoomOut: jest.fn(),
    reset: jest.fn(),
    destroy: jest.fn(),
    zoomWithWheel: jest.fn(),
    getPan: jest.fn().mockReturnValue({ x: 0, y: 0 }),
    getScale: jest.fn().mockReturnValue(1),
  };

  const mockPanzoom = jest.mocked(Panzoom);
  mockPanzoom.mockReturnValue(mockInstance as never);

  return {
    getInstance: () => mockInstance,
    getConstructor: () => mockPanzoom,
  };
};
