import { architectureProjectMapHeadlineFrontendReactBroker } from './architecture-project-map-headline-frontend-react-broker';
import { architectureProjectMapHeadlineFrontendReactBrokerProxy } from './architecture-project-map-headline-frontend-react-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('architectureProjectMapHeadlineFrontendReactBroker', () => {
  it('VALID: {any frontend-react package} => returns empty content (boot-tree owns the integrated flow)', () => {
    architectureProjectMapHeadlineFrontendReactBrokerProxy();
    const result = architectureProjectMapHeadlineFrontendReactBroker({
      projectRoot: AbsoluteFilePathStub({ value: '/repo' }),
      packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/web' }),
    });

    expect(String(result)).toBe('');
  });
});
