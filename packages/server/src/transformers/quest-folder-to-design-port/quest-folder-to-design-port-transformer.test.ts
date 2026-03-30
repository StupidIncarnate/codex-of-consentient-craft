import { questFolderToDesignPortTransformer } from './quest-folder-to-design-port-transformer';

describe('questFolderToDesignPortTransformer', () => {
  describe('port computation', () => {
    it('VALID: {questFolder: "001-add-auth"} => returns 5351', () => {
      const port = questFolderToDesignPortTransformer({ questFolder: '001-add-auth' });

      expect(port).toBe(5351);
    });

    it('VALID: {same input twice} => returns same port', () => {
      const port1 = questFolderToDesignPortTransformer({ questFolder: '001-add-auth' });
      const port2 = questFolderToDesignPortTransformer({ questFolder: '001-add-auth' });

      expect(port1).toBe(port2);
    });

    it('EDGE: {different folders} => returns distinct deterministic ports', () => {
      const port1 = questFolderToDesignPortTransformer({ questFolder: '001-add-auth' });
      const port2 = questFolderToDesignPortTransformer({ questFolder: '002-add-dashboard' });

      expect(port1).toBe(5351);
      expect(port2).toBe(5313);
    });
  });
});
