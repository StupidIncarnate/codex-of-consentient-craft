import { ParseXmlResultStub } from './parse-xml-result.stub';

describe('ParseXmlResultStub', () => {
  it('VALID: {} => the real parsed value for the default XML document', () => {
    expect(ParseXmlResultStub()).toStrictEqual({ root: { child: 'value' } });
  });

  it('VALID: {xml} => reflects the given document', () => {
    expect(ParseXmlResultStub({ xml: '<a><b>1</b></a>' })).toStrictEqual({ a: { b: '1' } });
  });
});
