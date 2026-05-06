import { statuslineInputContract } from './statusline-input-contract';
import { StatuslineInputStub } from './statusline-input.stub';

describe('statuslineInputContract', () => {
  it('VALID: full shape => parses successfully', () => {
    const result = statuslineInputContract.parse(StatuslineInputStub());

    expect(result).toStrictEqual({
      rate_limits: {
        five_hour: { used_percentage: 42, resets_at: '2026-05-05T15:00:00.000Z' },
        seven_day: { used_percentage: 20, resets_at: '2026-05-05T15:00:00.000Z' },
      },
    });
  });

  it('VALID: {} => parses with all fields omitted', () => {
    const result = statuslineInputContract.parse({});

    expect(result).toStrictEqual({});
  });

  it('VALID: passthrough preserves unknown fields', () => {
    const result = statuslineInputContract.parse({
      rate_limits: {},
      cwd: '/home/x',
      model: { id: 'claude' },
    });

    expect(result).toStrictEqual({
      rate_limits: {},
      cwd: '/home/x',
      model: { id: 'claude' },
    });
  });
});
