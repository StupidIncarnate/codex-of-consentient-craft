import { InventoryManager, InventoryItem } from './inventory';

describe('InventoryModule - InventoryManager', () => {
  let inventoryManager: InventoryManager;
  let sampleItem: InventoryItem;

  beforeEach(() => {
    inventoryManager = new InventoryManager();
    sampleItem = {
      id: '1',
      name: 'Test Item',
      quantity: 10,
      price: 25.50
    };
  });

  describe('InventoryModule - addItem', () => {
    it('should add an item to the inventory', () => {
      inventoryManager.addItem(sampleItem);
      expect(inventoryManager.getItem('1')).toEqual(sampleItem);
    });
  });

  describe('InventoryModule - getItem', () => {
    it('should return the correct item when it exists', () => {
      inventoryManager.addItem(sampleItem);
      const retrievedItem = inventoryManager.getItem('1');
      expect(retrievedItem).toEqual(sampleItem);
    });

    it('should return undefined when item does not exist', () => {
      const retrievedItem = inventoryManager.getItem('non-existent');
      expect(retrievedItem).toBeUndefined();
    });
  });

  describe('InventoryModule - updateQuantity', () => {
    it('should update quantity of existing item', () => {
      inventoryManager.addItem(sampleItem);
      const result = inventoryManager.updateQuantity('1', 15);
      expect(result).toBe(true);
      expect(inventoryManager.getItem('1')?.quantity).toBe(15);
    });

    it('should return false when trying to update non-existent item', () => {
      const result = inventoryManager.updateQuantity('non-existent', 15);
      expect(result).toBe(false);
    });
  });

  describe('InventoryModule - removeItem', () => {
    it('should remove an existing item', () => {
      inventoryManager.addItem(sampleItem);
      const result = inventoryManager.removeItem('1');
      expect(result).toBe(true);
      expect(inventoryManager.getItem('1')).toBeUndefined();
    });

    it('should return false when trying to remove non-existent item', () => {
      const result = inventoryManager.removeItem('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('InventoryModule - getAllItems', () => {
    it('should return all items in inventory', () => {
      const item2: InventoryItem = {
        id: '2',
        name: 'Second Item',
        quantity: 5,
        price: 10.00
      };
      
      inventoryManager.addItem(sampleItem);
      inventoryManager.addItem(item2);
      
      const allItems = inventoryManager.getAllItems();
      expect(allItems).toHaveLength(2);
      expect(allItems).toContain(sampleItem);
      expect(allItems).toContain(item2);
    });
  });

  describe('InventoryModule - getTotalValue', () => {
    it('should calculate total value of all items', () => {
      const item2: InventoryItem = {
        id: '2',
        name: 'Second Item',
        quantity: 5,
        price: 10.00
      };
      
      inventoryManager.addItem(sampleItem); // 10 * 25.50 = 255
      inventoryManager.addItem(item2); // 5 * 10.00 = 50
      
      const totalValue = inventoryManager.getTotalValue();
      expect(totalValue).toBe(305); // 255 + 50
    });
  });

  describe('InventoryModule - isInStock', () => {
    it('should return true when item is in stock', () => {
      inventoryManager.addItem(sampleItem);
      expect(inventoryManager.isInStock('1')).toBe(true);
    });

    it('should return false when item is out of stock', () => {
      const outOfStockItem: InventoryItem = {
        id: '3',
        name: 'Out of Stock Item',
        quantity: 0,
        price: 15.00
      };
      
      inventoryManager.addItem(outOfStockItem);
      expect(inventoryManager.isInStock('3')).toBe(false);
    });

    it('should return false when item does not exist', () => {
      expect(inventoryManager.isInStock('non-existent')).toBe(false);
    });
  });
});