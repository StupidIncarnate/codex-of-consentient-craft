const mockLayout = jest.fn();

const mockInstance = { layout: mockLayout };

const ELK = jest.fn().mockReturnValue(mockInstance);

module.exports = ELK;
module.exports.default = ELK;
