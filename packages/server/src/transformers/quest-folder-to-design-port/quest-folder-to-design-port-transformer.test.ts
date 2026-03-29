import { questFolderToDesignPortTransformer } from './quest-folder-to-design-port-transformer';

describe('questFolderToDesignPortTransformer', () => {
  describe('port computation', () => {
    it('VALID: {questFolder: "001-add-auth"} => returns port in range 5000-5999', () => {
      const port = questFolderToDesignPortTransformer({ questFolder: '001-add-auth' });

      expect(port).toBeGreaterThanOrEqual(5000);
      expect(port).toBeLessThan(6000);
    });

    it('VALID: {same input twice} => returns same port', () => {
      const port1 = questFolderToDesignPortTransformer({ questFolder: '001-add-auth' });
      const port2 = questFolderToDesignPortTransformer({ questFolder: '001-add-auth' });

      expect(port1).toBe(port2);
    });

    it('EDGE: {different folders} => returns different ports', () => {
      const port1 = questFolderToDesignPortTransformer({ questFolder: '001-add-auth' });
      const port2 = questFolderToDesignPortTransformer({ questFolder: '002-add-dashboard' });

      expect(port1).not.toBe(port2);
    });
  });
});
