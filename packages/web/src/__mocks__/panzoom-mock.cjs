const mockInstance = {
  zoomIn: jest.fn(),
  zoomOut: jest.fn(),
  reset: jest.fn(),
  destroy: jest.fn(),
  getScale: jest.fn().mockReturnValue(1),
  getPan: jest.fn().mockReturnValue({ x: 0, y: 0 }),
};

const Panzoom = jest.fn().mockReturnValue(mockInstance);

module.exports = Panzoom;
module.exports.default = Panzoom;
