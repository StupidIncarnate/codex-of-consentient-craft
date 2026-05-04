import { architectureResponderAnnotationsBroker } from './architecture-responder-annotations-broker';
import { architectureResponderAnnotationsBrokerProxy } from './architecture-responder-annotations-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { PackageTypeStub } from '../../../contracts/package-type/package-type.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/foo' });

describe('architectureResponderAnnotationsBroker', () => {
  describe('empty packages by type', () => {
    it('VALID: {programmatic-service} => returns empty maps for both', () => {
      architectureResponderAnnotationsBrokerProxy();

      const result = architectureResponderAnnotationsBroker({
        packageType: PackageTypeStub({ value: 'programmatic-service' }),
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
        packageType: PackageTypeStub({ value: 'frontend-react' }),
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
        packageType: PackageTypeStub({ value: 'eslint-plugin' }),
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
