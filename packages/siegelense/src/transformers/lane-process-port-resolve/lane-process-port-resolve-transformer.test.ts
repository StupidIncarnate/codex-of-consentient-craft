import { laneProcessPortResolveTransformer } from './lane-process-port-resolve-transformer';
import { PortPairStub } from '../../contracts/port-pair/port-pair.stub';
import { PortRoleStub } from '../../contracts/port-role/port-role.stub';

describe('laneProcessPortResolveTransformer', () => {
  describe('a process claiming the api role', () => {
    it('VALID: {portRole: "api"} => returns ports.api', () => {
      const ports = PortPairStub({ api: 34_172, web: 34_173 });

      const result = laneProcessPortResolveTransformer({
        portRole: PortRoleStub({ value: 'api' }),
        ports,
      });

      expect(result).toBe(34_172);
    });
  });

  describe('a process claiming the web role', () => {
    it('VALID: {portRole: "web"} => returns ports.web', () => {
      const ports = PortPairStub({ api: 34_172, web: 34_173 });

      const result = laneProcessPortResolveTransformer({
        portRole: PortRoleStub({ value: 'web' }),
        ports,
      });

      expect(result).toBe(34_173);
    });
  });

  describe('a process with no port role', () => {
    it('EMPTY: {portRole: null} => returns null', () => {
      const ports = PortPairStub({ api: 34_172, web: 34_173 });

      const result = laneProcessPortResolveTransformer({ portRole: null, ports });

      expect(result).toBe(null);
    });
  });
});
