import { ParameterNameStub } from './parameter-name.stub';

describe('parameterNameContract', () => {
  it('VALID: {value: "destructured object"} => parses successfully', () => {
    const result = ParameterNameStub({ value: 'destructured object' });

    expect(result).toBe('destructured object');
  });

  it('VALID: {value: "userId"} => parses successfully', () => {
    const result = ParameterNameStub({ value: 'userId' });

    expect(result).toBe('userId');
  });

  it('VALID: {value: "userName"} => parses successfully', () => {
    const result = ParameterNameStub({ value: 'userName' });

    expect(result).toBe('userName');
  });

  it('VALID: {value: "parameter-name"} => parses successfully', () => {
    const result = ParameterNameStub({ value: 'parameter-name' });

    expect(result).toBe('parameter-name');
  });

  it('VALID: {value: "parameter_name"} => parses successfully', () => {
    const result = ParameterNameStub({ value: 'parameter_name' });

    expect(result).toBe('parameter_name');
  });

  it('VALID: {value: "a"} => parses successfully', () => {
    const result = ParameterNameStub({ value: 'a' });

    expect(result).toBe('a');
  });

  it('VALID: {value: ""} => parses successfully', () => {
    const result = ParameterNameStub({ value: '' });

    expect(result).toBe('');
  });

  it('VALID: {value: "veryLongParameterNameWithLotsOfCharacters"} => parses successfully', () => {
    const result = ParameterNameStub({
      value: 'veryLongParameterNameWithLotsOfCharacters',
    });

    expect(result).toBe('veryLongParameterNameWithLotsOfCharacters');
  });

  it('VALID: {value: "param123"} => parses successfully', () => {
    const result = ParameterNameStub({ value: 'param123' });

    expect(result).toBe('param123');
  });

  it('VALID: {value: "$specialParam"} => parses successfully', () => {
    const result = ParameterNameStub({ value: '$specialParam' });

    expect(result).toBe('$specialParam');
  });

  it('VALID: {value: "_privateParam"} => parses successfully', () => {
    const result = ParameterNameStub({ value: '_privateParam' });

    expect(result).toBe('_privateParam');
  });

  it('VALID: {value: "paramétré"} => parses successfully', () => {
    const result = ParameterNameStub({ value: 'paramétré' });

    expect(result).toBe('paramétré');
  });

  it('VALID: {value: "参数名"} => parses successfully', () => {
    const result = ParameterNameStub({ value: '参数名' });

    expect(result).toBe('参数名');
  });
});
