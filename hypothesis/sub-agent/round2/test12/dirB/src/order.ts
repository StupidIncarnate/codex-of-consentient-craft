export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: Date;
  totalAmount: number;
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export class OrderProcessor {
  private orders: Map<string, Order> = new Map();

  createOrder(customerId: string, items: OrderItem[]): Order {
    const orderId = this.generateOrderId();
    const totalAmount = this.calculateTotalAmount(items);
    
    const order: Order = {
      id: orderId,
      customerId,
      items,
      status: OrderStatus.PENDING,
      createdAt: new Date(),
      totalAmount
    };

    this.orders.set(orderId, order);
    return order;
  }

  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  updateOrderStatus(orderId: string, status: OrderStatus): boolean {
    const order = this.orders.get(orderId);
    if (order) {
      order.status = status;
      return true;
    }
    return false;
  }

  cancelOrder(orderId: string): boolean {
    const order = this.orders.get(orderId);
    if (order && order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.CANCELLED;
      return true;
    }
    return false;
  }

  getOrdersByCustomer(customerId: string): Order[] {
    return Array.from(this.orders.values())
      .filter(order => order.customerId === customerId);
  }

  getOrdersByStatus(status: OrderStatus): Order[] {
    return Array.from(this.orders.values())
      .filter(order => order.status === status);
  }

  getAllOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  private generateOrderId(): string {
    return `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateTotalAmount(items: OrderItem[]): number {
    return items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  }
}