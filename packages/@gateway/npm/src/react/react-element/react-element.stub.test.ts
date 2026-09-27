import { ReactElementStub } from './react-element.stub';

describe('ReactElementStub', () => {
  it('VALID: {} => a real ReactElement for a div with the default text', () => {
    const element = ReactElementStub();

    expect({ type: element.type, children: element.props.children }).toStrictEqual({
      type: 'div',
      children: 'gateway-stub',
    });
  });

  it('VALID: {text} => reflects the given text', () => {
    const element = ReactElementStub({ text: 'other' });

    expect(element.props.children).toBe('other');
  });
});
