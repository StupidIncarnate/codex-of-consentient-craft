import { architectureResponderAnnotationsBroker } from './architecture-responder-annotations-broker';
import { architectureResponderAnnotationsBrokerProxy } from './architecture-responder-annotations-broker.proxy';

const PROJECT_ROOT = '/repo';
const PACKAGE_ROOT = '/repo/packages/foo';

describe('architectureResponderAnnotationsBroker', () => {
  describe('empty packages by type', () => {
    it('VALID: {programmatic-service} => returns empty maps for both', () => {
      architectureResponderAnnotationsBrokerProxy();

      const result = architectureResponderAnnotationsBroker({
        packageType: 'programmatic-service',
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual({
        responderAnnotations: new Map(),
        startupAnnotations: new Map(),
      });
    });

    it('VALID: {frontend-react} => returns empty maps (widget context handles inline)', () => {
      architectureResponderAnnotationsBrokerProxy();

      const result = architectureResponderAnnotationsBroker({
        packageType: 'frontend-react',
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual({
        responderAnnotations: new Map(),
        startupAnnotations: new Map(),
      });
    });

    it('VALID: {eslint-plugin} => returns empty maps for both', () => {
      architectureResponderAnnotationsBrokerProxy();

      const result = architectureResponderAnnotationsBroker({
        packageType: 'eslint-plugin',
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual({
        responderAnnotations: new Map(),
        startupAnnotations: new Map(),
      });
    });
  });
});
