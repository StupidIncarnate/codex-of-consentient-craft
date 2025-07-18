import { OrderProcessor, OrderItem, OrderStatus, Order } from './order';

describe('OrderService - OrderProcessor', () => {
  let orderProcessor: OrderProcessor;
  let sampleOrderItems: OrderItem[];

  beforeEach(() => {
    orderProcessor = new OrderProcessor();
    sampleOrderItems = [
      {
        productId: 'P1',
        productName: 'Test Product 1',
        quantity: 2,
        unitPrice: 25.00
      },
      {
        productId: 'P2',
        productName: 'Test Product 2',
        quantity: 1,
        unitPrice: 15.00
      }
    ];
  });

  describe('OrderService - createOrder', () => {
    it('should create a new order with correct details', () => {
      const order = orderProcessor.createOrder('CUST-123', sampleOrderItems);
      
      expect(order.id).toBeDefined();
      expect(order.customerId).toBe('CUST-123');
      expect(order.items).toEqual(sampleOrderItems);
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.totalAmount).toBe(65.00); // (2 * 25.00) + (1 * 15.00)
      expect(order.createdAt).toBeInstanceOf(Date);
    });

    it('should generate unique order IDs', () => {
      const order1 = orderProcessor.createOrder('CUST-123', sampleOrderItems);
      const order2 = orderProcessor.createOrder('CUST-456', sampleOrderItems);
      
      expect(order1.id).not.toBe(order2.id);
    });
  });

  describe('OrderService - getOrder', () => {
    it('should return the correct order when it exists', () => {
      const createdOrder = orderProcessor.createOrder('CUST-123', sampleOrderItems);
      const retrievedOrder = orderProcessor.getOrder(createdOrder.id);
      
      expect(retrievedOrder).toEqual(createdOrder);
    });

    it('should return undefined when order does not exist', () => {
      const retrievedOrder = orderProcessor.getOrder('non-existent-id');
      expect(retrievedOrder).toBeUndefined();
    });
  });

  describe('OrderService - updateOrderStatus', () => {
    it('should update the status of an existing order', () => {
      const order = orderProcessor.createOrder('CUST-123', sampleOrderItems);
      const result = orderProcessor.updateOrderStatus(order.id, OrderStatus.PROCESSING);
      
      expect(result).toBe(true);
      expect(orderProcessor.getOrder(order.id)?.status).toBe(OrderStatus.PROCESSING);
    });

    it('should return false when trying to update non-existent order', () => {
      const result = orderProcessor.updateOrderStatus('non-existent-id', OrderStatus.PROCESSING);
      expect(result).toBe(false);
    });
  });

  describe('OrderService - cancelOrder', () => {
    it('should cancel a pending order', () => {
      const order = orderProcessor.createOrder('CUST-123', sampleOrderItems);
      const result = orderProcessor.cancelOrder(order.id);
      
      expect(result).toBe(true);
      expect(orderProcessor.getOrder(order.id)?.status).toBe(OrderStatus.CANCELLED);
    });

    it('should not cancel a non-pending order', () => {
      const order = orderProcessor.createOrder('CUST-123', sampleOrderItems);
      orderProcessor.updateOrderStatus(order.id, OrderStatus.PROCESSING);
      
      const result = orderProcessor.cancelOrder(order.id);
      expect(result).toBe(false);
      expect(orderProcessor.getOrder(order.id)?.status).toBe(OrderStatus.PROCESSING);
    });

    it('should return false when trying to cancel non-existent order', () => {
      const result = orderProcessor.cancelOrder('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('OrderService - getOrdersByCustomer', () => {
    it('should return all orders for a specific customer', () => {
      const order1 = orderProcessor.createOrder('CUST-123', sampleOrderItems);
      const order2 = orderProcessor.createOrder('CUST-123', sampleOrderItems);
      const order3 = orderProcessor.createOrder('CUST-456', sampleOrderItems);
      
      const customerOrders = orderProcessor.getOrdersByCustomer('CUST-123');
      
      expect(customerOrders).toHaveLength(2);
      expect(customerOrders).toContain(order1);
      expect(customerOrders).toContain(order2);
      expect(customerOrders).not.toContain(order3);
    });

    it('should return empty array when customer has no orders', () => {
      const customerOrders = orderProcessor.getOrdersByCustomer('CUST-999');
      expect(customerOrders).toHaveLength(0);
    });
  });

  describe('OrderService - getOrdersByStatus', () => {
    it('should return all orders with a specific status', () => {
      const order1 = orderProcessor.createOrder('CUST-123', sampleOrderItems);
      const order2 = orderProcessor.createOrder('CUST-456', sampleOrderItems);
      orderProcessor.updateOrderStatus(order2.id, OrderStatus.PROCESSING);
      
      const pendingOrders = orderProcessor.getOrdersByStatus(OrderStatus.PENDING);
      const processingOrders = orderProcessor.getOrdersByStatus(OrderStatus.PROCESSING);
      
      expect(pendingOrders).toHaveLength(1);
      expect(pendingOrders).toContain(order1);
      expect(processingOrders).toHaveLength(1);
      expect(processingOrders).toContain(order2);
    });
  });

  describe('OrderService - getAllOrders', () => {
    it('should return all orders', () => {
      const order1 = orderProcessor.createOrder('CUST-123', sampleOrderItems);
      const order2 = orderProcessor.createOrder('CUST-456', sampleOrderItems);
      
      const allOrders = orderProcessor.getAllOrders();
      
      expect(allOrders).toHaveLength(2);
      expect(allOrders).toContain(order1);
      expect(allOrders).toContain(order2);
    });

    it('should return empty array when no orders exist', () => {
      const allOrders = orderProcessor.getAllOrders();
      expect(allOrders).toHaveLength(0);
    });
  });
});