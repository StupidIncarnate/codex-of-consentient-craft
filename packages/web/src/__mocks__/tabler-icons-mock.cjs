const React = require('react');

const createIconMock = (name) => {
  const Icon = (props) => React.createElement('span', { 'data-testid': name, ...props });
  Icon.displayName = name;
  return Icon;
};

module.exports = new Proxy(
  {},
  {
    get: (_target, prop) => {
      if (prop === '__esModule') return true;
      if (typeof prop === 'string' && prop.startsWith('Icon')) {
        return createIconMock(prop);
      }
      return undefined;
    },
  },
);
