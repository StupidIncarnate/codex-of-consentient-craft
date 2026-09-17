import { agentsMdCreatorTransformer } from './agents-md-creator-transformer';

describe('agentsMdCreatorTransformer', () => {
  it('VALID: creates AGENTS.md content => directs agent to read CLAUDE.md', () => {
    const result = agentsMdCreatorTransformer();

    expect(result).toBe(
      '# Agent Guidelines\n\nGo read [CLAUDE.md](file://./CLAUDE.md) to get context on the project and repo before doing any other exploratory work.\n',
    );
  });
});
