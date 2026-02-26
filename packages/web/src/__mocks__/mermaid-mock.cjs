module.exports = {
  __esModule: true,
  default: {
    initialize: jest.fn(),
    render: jest.fn().mockResolvedValue({ svg: '<svg></svg>' }),
  },
};
