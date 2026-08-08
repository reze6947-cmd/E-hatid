import { Order } from '../types';
import { notificationService } from './NotificationService';

/**
 * OrderTrackingService - Manages order lifecycle and status updates
 * Orchestrates connections between User, Vendor, and Rider
 */
class OrderTrackingService {
  private orders: Map<string, Order> = new Map();
  private orderListeners: Map<string, ((order: Order) => void)[]> = new Map();

  /**
   * CREATE ORDER - User places order
   * Status: pending
   */
  createOrder(order: Omit<Order, 'id' | 'createdAt'>): Order {
    const newOrder: Order = {
      ...order,
      id: `order_${Date.now()}`,
      createdAt: new Date(),
      status: 'pending',
    };

    this.orders.set(newOrder.id, newOrder);

    // Notify vendor that new order is pending
    if (newOrder.vendorId) {
      notificationService.notifyOrderPlaced(newOrder, newOrder.vendorId);
    }

    this.emit(newOrder.id, newOrder);
    return newOrder;
  }

  /**
   * GET ORDER
   */
  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  /**
   * VENDOR ACCEPTS ORDER
   * Status: pending → preparing
   * Flow: Customer → Rider → Vendor (starts preparing)
   */
  vendorAcceptOrder(orderId: string, vendorId: string): Order | null {
    const order = this.orders.get(orderId);
    if (!order || order.vendorId !== vendorId) {
      console.error('Order not found or unauthorized');
      return null;
    }

    order.status = 'preparing';
    order.acceptedAt = new Date();

    // Send message from vendor to user (auto-generated)
    notificationService.sendMessage({
      senderId: vendorId,
      senderRole: 'vendor',
      receiverId: order.userId,
      orderId: orderId,
      content: `Your order has been accepted! We are preparing it now.`,
      isRead: false,
      messageType: 'notification',
    });

    // Notify user
    notificationService.notifyOrderAccepted(order, order.userId);
    notificationService.notifyOrderPreparing(order, order.userId);

    this.emit(orderId, order);
    return order;
  }

  /**
   * VENDOR REJECTS ORDER
   * Status: rejected
   */
  vendorRejectOrder(orderId: string, vendorId: string, reason?: string): Order | null {
    const order = this.orders.get(orderId);
    if (!order || order.vendorId !== vendorId) {
      console.error('Order not found or unauthorized');
      return null;
    }

    order.status = 'rejected';

    // Send message from vendor to user
    notificationService.sendMessage({
      senderId: vendorId,
      senderRole: 'vendor',
      receiverId: order.userId,
      orderId: orderId,
      content: reason || 'Unfortunately, we cannot fulfill this order at the moment.',
      isRead: false,
      messageType: 'notification',
    });

    // Notify user
    notificationService.notifyOrderRejected(order, order.userId, reason);

    this.emit(orderId, order);
    return order;
  }

  /**
   * VENDOR MARKS ORDER READY FOR PICKUP
   * Status: preparing → ready_for_pickup
   * Vendor notifies rider that food is ready, rider can now pick up
   */
  vendorMarkReady(orderId: string, vendorId: string): Order | null {
    const order = this.orders.get(orderId);
    if (!order || order.vendorId !== vendorId) {
      console.error('Order not found or unauthorized');
      return null;
    }

    order.status = 'ready_for_pickup';
    order.readyAt = new Date();

    // Assign a rider (in real app, use matchmaking algorithm)
    const mockRiderId = `rider_${Math.floor(Math.random() * 1000)}`;
    order.riderId = mockRiderId;

    // Notify both user and rider
    if (mockRiderId) {
      notificationService.notifyOrderReady(order, order.userId, mockRiderId);

      // Send message from vendor to rider
      notificationService.sendMessage({
        senderId: vendorId,
        senderRole: 'vendor',
        receiverId: mockRiderId,
        orderId: orderId,
        content: `Order for ${order.customerName} is ready for pickup. Address: ${order.deliveryAddress}`,
        isRead: false,
        messageType: 'notification',
      });
    }

    this.emit(orderId, order);
    return order;
  }

  /**
   * RIDER PICKS UP ORDER FROM VENDOR
   * Status: ready_for_pickup → ready_for_pickup (still waiting for delivery)
   * Rider has collected order from vendor, now heading to customer
   */
  riderPickedUpOrder(orderId: string, riderId: string): Order | null {
    const order = this.orders.get(orderId);
    if (!order || order.riderId !== riderId) {
      console.error('Order not found or unauthorized');
      return null;
    }

    // Status remains 'ready_for_pickup' until delivered, but track pickup time
    order.pickedUpAt = new Date();

    // Send message from rider to user
    notificationService.sendMessage({
      senderId: riderId,
      senderRole: 'rider',
      receiverId: order.userId,
      orderId: orderId,
      content: `I've picked up your order from ${order.stallName}! I'm on my way now.`,
      isRead: false,
      messageType: 'notification',
    });

    const mockRiderName = `Rider ${riderId.slice(-3)}`;
    notificationService.notifyRiderPickedUp(order, order.userId, mockRiderName);

    this.emit(orderId, order);
    return order;
  }

  /**
   * ORDER COMPLETED
   * Status: ready_for_pickup → completed
   * Rider has delivered order to customer
   */
  completeDelivery(orderId: string, riderId: string): Order | null {
    const order = this.orders.get(orderId);
    if (!order || order.riderId !== riderId) {
      console.error('Order not found or unauthorized');
      return null;
    }

    order.status = 'completed';
    order.completedAt = new Date();

    // Send message from rider to user
    notificationService.sendMessage({
      senderId: riderId,
      senderRole: 'rider',
      receiverId: order.userId,
      orderId: orderId,
      content: `Your order has been delivered! Thank you for using our service.`,
      isRead: false,
      messageType: 'notification',
    });

    const mockRiderName = `Rider ${riderId.slice(-3)}`;
    notificationService.notifyOrderDelivered(order, order.userId, mockRiderName);

    // Also notify vendor that delivery is complete
    notificationService.sendMessage({
      senderId: riderId,
      senderRole: 'rider',
      receiverId: order.vendorId || '',
      orderId: orderId,
      content: `Order for ${order.customerName} has been delivered successfully.`,
      isRead: false,
      messageType: 'notification',
    });

    this.emit(orderId, order);
    return order;
  }

  /**
   * CANCEL ORDER
   */
  cancelOrder(orderId: string, reason?: string): Order | null {
    const order = this.orders.get(orderId);
    if (!order) {
      console.error('Order not found');
      return null;
    }

    order.status = 'cancelled';

    // Notify all parties
    notificationService.notifyOrderCancelled(order, order.userId, reason);

    this.emit(orderId, order);
    return order;
  }

  /**
   * GET ORDER HISTORY FOR USER
   */
  getUserOrders(userId: string): Order[] {
    return Array.from(this.orders.values()).filter(order => order.userId === userId);
  }

  /**
   * GET ORDERS FOR VENDOR
   */
  getVendorOrders(vendorId: string): Order[] {
    return Array.from(this.orders.values()).filter(order => order.vendorId === vendorId);
  }

  /**
   * GET ORDERS FOR RIDER
   */
  getRiderOrders(riderId: string): Order[] {
    return Array.from(this.orders.values()).filter(order => order.riderId === riderId);
  }

  /**
   * GET ACTIVE ORDERS FOR RIDER (not yet completed)
   */
  getRiderActiveOrders(riderId: string): Order[] {
    return this.getRiderOrders(riderId).filter(
      order => !['completed', 'cancelled'].includes(order.status)
    );
  }

  /**
   * Subscribe to order updates
   */
  subscribeToOrder(orderId: string, callback: (order: Order) => void): () => void {
    if (!this.orderListeners.has(orderId)) {
      this.orderListeners.set(orderId, []);
    }
    this.orderListeners.get(orderId)?.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.orderListeners.get(orderId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit order updates to subscribers
   */
  private emit(orderId: string, order: Order): void {
    const callbacks = this.orderListeners.get(orderId);
    if (callbacks) {
      callbacks.forEach(callback => callback(order));
    }
  }
}

// Export singleton instance
export const orderTrackingService = new OrderTrackingService();
