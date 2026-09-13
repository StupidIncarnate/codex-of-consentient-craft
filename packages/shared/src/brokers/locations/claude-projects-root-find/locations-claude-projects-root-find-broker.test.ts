import { locationsClaudeProjectsRootFindBroker } from './locations-claude-projects-root-find-broker';
import { locationsClaudeProjectsRootFindBrokerProxy } from './locations-claude-projects-root-find-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('locationsClaudeProjectsRootFindBroker', () => {
  it('VALID: {homeDir: "/home/user"} => returns /home/user/.claude/projects', () => {
    const proxy = locationsClaudeProjectsRootFindBrokerProxy();

    proxy.setupProjectsRoot({
      homeDir: FilePathStub({ value: '/home/user' }),
      projectsRoot: FilePathStub({ value: '/home/user/.claude/projects' }),
    });

    const result = locationsClaudeProjectsRootFindBroker();

    expect(result).toBe(AbsoluteFilePathStub({ value: '/home/user/.claude/projects' }));
  });
});
