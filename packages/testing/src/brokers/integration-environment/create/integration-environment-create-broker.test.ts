import { integrationEnvironmentCreateBroker } from './integration-environment-create-broker';
import { integrationEnvironmentCreateBrokerProxy } from './integration-environment-create-broker.proxy';
import { BaseNameStub } from '../../../contracts/base-name/base-name.stub';

describe('integrationEnvironmentCreateBroker', () => {
  describe('project creation', () => {
    it('VALID: {baseName} => creates test project with tracking', () => {
      integrationEnvironmentCreateBrokerProxy();
      const baseName = BaseNameStub({ value: 'test-project' });

      const project = integrationEnvironmentCreateBroker({ baseName });
      project.cleanup();

      expect(project.projectName).toMatch(/^test-project-[a-f0-9]{8}$/u);
    });
  });
});
