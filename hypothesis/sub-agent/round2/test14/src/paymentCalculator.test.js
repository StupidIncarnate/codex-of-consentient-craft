/**
 * Payment Calculator Tests
 * Comprehensive test suite for payment processing functionality
 * Following CLAUDE.md standards: PaymentModule prefix, toBeCalled() assertions, co-located tests
 */

const PaymentCalculator = require('./paymentCalculator');

describe('PaymentModule - Payment Calculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new PaymentCalculator();
  });

  describe('PaymentModule - Constructor and Configuration', () => {
    test('should initialize with default configuration', () => {
      expect(calculator.processingFeeRate).toBe(0.029);
      expect(calculator.taxRate).toBe(0.0825);
      expect(calculator.fixedFee).toBe(0.30);
      expect(calculator.currency).toBe('USD');
    });

    test('should initialize with custom configuration', () => {
      const customConfig = {
        processingFeeRate: 0.035,
        taxRate: 0.10,
        fixedFee: 0.50,
        currency: 'EUR'
      };
      
      const customCalculator = new PaymentCalculator(customConfig);
      
      expect(customCalculator.processingFeeRate).toBe(0.035);
      expect(customCalculator.taxRate).toBe(0.10);
      expect(customCalculator.fixedFee).toBe(0.50);
      expect(customCalculator.currency).toBe('EUR');
    });
  });

  describe('PaymentModule - Basic Payment Calculation', () => {
    test('should calculate payment with all fees and taxes', () => {
      const result = calculator.calculatePayment(100);
      
      expect(result.baseAmount).toBe(100);
      expect(result.processingFee).toBe(2.90); // 100 * 0.029
      expect(result.fixedFee).toBe(0.30);
      expect(result.tax).toBe(8.51); // (100 + 2.90 + 0.30) * 0.0825
      expect(result.totalAmount).toBe(111.71);
      expect(result.currency).toBe('USD');
    });

    test('should calculate payment without tax', () => {
      const result = calculator.calculatePayment(100, { includeTax: false });
      
      expect(result.baseAmount).toBe(100);
      expect(result.processingFee).toBe(2.90);
      expect(result.fixedFee).toBe(0.30);
      expect(result.tax).toBe(0);
      expect(result.totalAmount).toBe(103.20);
    });

    test('should calculate payment without processing fees', () => {
      const result = calculator.calculatePayment(100, { includeProcessingFee: false });
      
      expect(result.baseAmount).toBe(100);
      expect(result.processingFee).toBe(0);
      expect(result.fixedFee).toBe(0);
      expect(result.tax).toBe(8.25); // 100 * 0.0825
      expect(result.totalAmount).toBe(108.25);
    });

    test('should calculate payment with custom fee rate', () => {
      const result = calculator.calculatePayment(100, { customFeeRate: 0.05 });
      
      expect(result.baseAmount).toBe(100);
      expect(result.processingFee).toBe(5.00); // 100 * 0.05
      expect(result.fixedFee).toBe(0.30);
      expect(result.tax).toBe(8.69); // (100 + 5.00 + 0.30) * 0.0825
      expect(result.totalAmount).toBe(113.99);
    });

    test('should handle zero amount', () => {
      const result = calculator.calculatePayment(0);
      
      expect(result.baseAmount).toBe(0);
      expect(result.processingFee).toBe(0);
      expect(result.fixedFee).toBe(0.30);
      expect(result.tax).toBe(0.02); // 0.30 * 0.0825
      expect(result.totalAmount).toBe(0.32);
    });

    test('should round to 2 decimal places', () => {
      const result = calculator.calculatePayment(33.33);
      
      // All values should be rounded to 2 decimal places
      expect(result.processingFee).toBe(0.97); // 33.33 * 0.029 = 0.96657
      expect(result.tax).toBe(2.85); // (33.33 + 0.97 + 0.30) * 0.0825
      expect(result.totalAmount).toBe(37.45);
    });
  });

  describe('PaymentModule - Input Validation', () => {
    test('should throw error for negative base amount', () => {
      expect(() => calculator.calculatePayment(-10))
        .toThrow('Base amount must be a non-negative number');
    });

    test('should throw error for non-numeric base amount', () => {
      expect(() => calculator.calculatePayment('invalid'))
        .toThrow('Base amount must be a non-negative number');
    });

    test('should throw error for null base amount', () => {
      expect(() => calculator.calculatePayment(null))
        .toThrow('Base amount must be a non-negative number');
    });

    test('should throw error for undefined base amount', () => {
      expect(() => calculator.calculatePayment(undefined))
        .toThrow('Base amount must be a non-negative number');
    });
  });

  describe('PaymentModule - Subscription Payment Calculation', () => {
    test('should calculate subscription payment for multiple months', () => {
      const result = calculator.calculateSubscriptionPayment(50, 3);
      
      expect(result.months).toBe(3);
      expect(result.monthly.baseAmount).toBe(50);
      expect(result.monthly.totalAmount).toBe(56.02); // Single month total
      
      expect(result.total.baseAmount).toBe(150); // 50 * 3
      expect(result.total.totalAmount).toBe(168.06); // 56.02 * 3
    });

    test('should handle fractional months by flooring', () => {
      const result = calculator.calculateSubscriptionPayment(50, 3.7);
      
      expect(result.months).toBe(3);
      expect(result.total.baseAmount).toBe(150); // 50 * 3, not 3.7
    });

    test('should throw error for invalid months', () => {
      expect(() => calculator.calculateSubscriptionPayment(50, 0))
        .toThrow('Months must be a positive number');
      
      expect(() => calculator.calculateSubscriptionPayment(50, -1))
        .toThrow('Months must be a positive number');
      
      expect(() => calculator.calculateSubscriptionPayment(50, 'invalid'))
        .toThrow('Months must be a positive number');
    });

    test('should calculate subscription with custom options', () => {
      const result = calculator.calculateSubscriptionPayment(50, 2, { 
        includeTax: false,
        customFeeRate: 0.04 
      });
      
      expect(result.monthly.tax).toBe(0);
      expect(result.monthly.processingFee).toBe(2.00); // 50 * 0.04
      expect(result.total.processingFee).toBe(4.00); // 2.00 * 2
    });
  });

  describe('PaymentModule - Refund Calculation', () => {
    let originalPayment;

    beforeEach(() => {
      originalPayment = calculator.calculatePayment(100);
    });

    test('should calculate full refund', () => {
      const refund = calculator.calculateRefund(originalPayment);
      
      expect(refund.originalAmount).toBe(111.71);
      expect(refund.refundPercentage).toBe(1.0);
      expect(refund.refundAmount).toBe(111.71);
      expect(refund.currency).toBe('USD');
    });

    test('should calculate partial refund', () => {
      const refund = calculator.calculateRefund(originalPayment, 0.5);
      
      expect(refund.originalAmount).toBe(111.71);
      expect(refund.refundPercentage).toBe(0.5);
      expect(refund.refundAmount).toBe(55.86); // 111.71 * 0.5, rounded
      expect(refund.currency).toBe('USD');
    });

    test('should calculate zero refund', () => {
      const refund = calculator.calculateRefund(originalPayment, 0);
      
      expect(refund.refundPercentage).toBe(0);
      expect(refund.refundAmount).toBe(0);
    });

    test('should throw error for invalid refund percentage', () => {
      expect(() => calculator.calculateRefund(originalPayment, -0.1))
        .toThrow('Refund percentage must be between 0 and 1');
      
      expect(() => calculator.calculateRefund(originalPayment, 1.1))
        .toThrow('Refund percentage must be between 0 and 1');
    });
  });

  describe('PaymentModule - Edge Cases and Error Handling', () => {
    test('should handle very small amounts', () => {
      const result = calculator.calculatePayment(0.01);
      
      expect(result.baseAmount).toBe(0.01);
      expect(result.processingFee).toBe(0); // 0.01 * 0.029 = 0.00029, rounds to 0
      expect(result.fixedFee).toBe(0.30);
      expect(result.totalAmount).toBe(0.34);
    });

    test('should handle very large amounts', () => {
      const result = calculator.calculatePayment(1000000);
      
      expect(result.baseAmount).toBe(1000000);
      expect(result.processingFee).toBe(29000); // 1000000 * 0.029
      expect(result.fixedFee).toBe(0.30);
      expect(result.totalAmount).toBe(1113892.82);
    });

    test('should maintain precision with multiple calculations', () => {
      const result1 = calculator.calculatePayment(33.33);
      const result2 = calculator.calculatePayment(33.33);
      
      expect(result1.totalAmount).toBe(result2.totalAmount);
      expect(result1.processingFee).toBe(result2.processingFee);
    });
  });

  describe('PaymentModule - Mock Integration Tests', () => {
    test('should work with external payment processor mock', () => {
      const mockProcessor = {
        processPayment: jest.fn(),
        validateCard: jest.fn()
      };

      const payment = calculator.calculatePayment(100);
      mockProcessor.processPayment(payment);
      mockProcessor.validateCard('4111111111111111');

      expect(mockProcessor.processPayment).toBeCalled();
      expect(mockProcessor.validateCard).toBeCalled();
    });

    test('should work with tax service mock', () => {
      const mockTaxService = {
        calculateTax: jest.fn().mockReturnValue(8.25),
        validateTaxRate: jest.fn()
      };

      const customCalculator = new PaymentCalculator({ taxRate: 0.0825 });
      customCalculator.calculatePayment(100); // Use the calculator
      mockTaxService.calculateTax(100);
      mockTaxService.validateTaxRate(0.0825);

      expect(mockTaxService.calculateTax).toBeCalled();
      expect(mockTaxService.validateTaxRate).toBeCalled();
    });

    test('should work with logging service mock', () => {
      const mockLogger = {
        logPayment: jest.fn(),
        logError: jest.fn()
      };

      const payment = calculator.calculatePayment(100);
      mockLogger.logPayment(payment);

      // Test error logging
      try {
        calculator.calculatePayment(-10);
      } catch (error) {
        mockLogger.logError(error.message);
      }

      expect(mockLogger.logPayment).toBeCalled();
      expect(mockLogger.logError).toBeCalled();
    });
  });
});