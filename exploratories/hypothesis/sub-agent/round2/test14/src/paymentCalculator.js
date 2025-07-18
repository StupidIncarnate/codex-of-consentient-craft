/**
 * Payment Calculator Module
 * Handles calculation of total payment amounts including fees, taxes, and other charges
 * Critical financial service with high reliability requirements
 */

class PaymentCalculator {
  constructor(config = {}) {
    this.processingFeeRate = config.processingFeeRate || 0.029; // 2.9% default
    this.taxRate = config.taxRate || 0.0825; // 8.25% default
    this.fixedFee = config.fixedFee || 0.30; // $0.30 default
    this.currency = config.currency || 'USD';
  }

  /**
   * Calculate total payment amount including all fees and taxes
   * @param {number} baseAmount - Base payment amount
   * @param {Object} options - Additional options
   * @param {boolean} options.includeTax - Whether to include tax
   * @param {boolean} options.includeProcessingFee - Whether to include processing fee
   * @param {number} options.customFeeRate - Custom fee rate override
   * @returns {Object} Payment calculation breakdown
   */
  calculatePayment(baseAmount, options = {}) {
    if (typeof baseAmount !== 'number' || baseAmount < 0) {
      throw new Error('Base amount must be a non-negative number');
    }

    const {
      includeTax = true,
      includeProcessingFee = true,
      customFeeRate = null
    } = options;

    let calculation = {
      baseAmount,
      processingFee: 0,
      fixedFee: 0,
      tax: 0,
      totalAmount: baseAmount,
      currency: this.currency
    };

    // Apply processing fees
    if (includeProcessingFee) {
      const feeRate = customFeeRate !== null ? customFeeRate : this.processingFeeRate;
      calculation.processingFee = baseAmount * feeRate;
      calculation.fixedFee = this.fixedFee;
    }

    // Calculate subtotal before tax
    const subtotal = calculation.baseAmount + calculation.processingFee + calculation.fixedFee;

    // Apply tax
    if (includeTax) {
      calculation.tax = subtotal * this.taxRate;
    }

    // Calculate total
    calculation.totalAmount = subtotal + calculation.tax;

    // Round to 2 decimal places for currency
    calculation.processingFee = Math.round(calculation.processingFee * 100) / 100;
    calculation.fixedFee = Math.round(calculation.fixedFee * 100) / 100;
    calculation.tax = Math.round(calculation.tax * 100) / 100;
    calculation.totalAmount = Math.round(calculation.totalAmount * 100) / 100;

    return calculation;
  }

  /**
   * Calculate payment for subscription with recurring fees
   * @param {number} baseAmount - Base subscription amount
   * @param {number} months - Number of months
   * @param {Object} options - Additional options
   * @returns {Object} Subscription payment calculation
   */
  calculateSubscriptionPayment(baseAmount, months, options = {}) {
    if (typeof months !== 'number' || months < 1) {
      throw new Error('Months must be a positive number');
    }

    const monthlyCalculation = this.calculatePayment(baseAmount, options);
    const totalMonths = Math.floor(months);
    
    return {
      monthly: monthlyCalculation,
      total: {
        ...monthlyCalculation,
        baseAmount: monthlyCalculation.baseAmount * totalMonths,
        processingFee: monthlyCalculation.processingFee * totalMonths,
        fixedFee: monthlyCalculation.fixedFee * totalMonths,
        tax: monthlyCalculation.tax * totalMonths,
        totalAmount: monthlyCalculation.totalAmount * totalMonths
      },
      months: totalMonths
    };
  }

  /**
   * Calculate refund amount based on original payment
   * @param {Object} originalPayment - Original payment calculation
   * @param {number} refundPercentage - Percentage to refund (0-1)
   * @returns {Object} Refund calculation
   */
  calculateRefund(originalPayment, refundPercentage = 1.0) {
    if (refundPercentage < 0 || refundPercentage > 1) {
      throw new Error('Refund percentage must be between 0 and 1');
    }

    const refundAmount = originalPayment.totalAmount * refundPercentage;
    
    return {
      originalAmount: originalPayment.totalAmount,
      refundPercentage,
      refundAmount: Math.round(refundAmount * 100) / 100,
      currency: this.currency
    };
  }
}

module.exports = PaymentCalculator;