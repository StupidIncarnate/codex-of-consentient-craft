export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export class InventoryManager {
  private items: Map<string, InventoryItem> = new Map();

  addItem(item: InventoryItem): void {
    this.items.set(item.id, item);
  }

  getItem(id: string): InventoryItem | undefined {
    return this.items.get(id);
  }

  updateQuantity(id: string, quantity: number): boolean {
    const item = this.items.get(id);
    if (item) {
      item.quantity = quantity;
      return true;
    }
    return false;
  }

  removeItem(id: string): boolean {
    return this.items.delete(id);
  }

  getAllItems(): InventoryItem[] {
    return Array.from(this.items.values());
  }

  getTotalValue(): number {
    return Array.from(this.items.values())
      .reduce((total, item) => total + (item.quantity * item.price), 0);
  }

  isInStock(id: string): boolean {
    const item = this.items.get(id);
    return item ? item.quantity > 0 : false;
  }
}