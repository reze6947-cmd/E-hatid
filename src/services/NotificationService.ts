import { Notification, Message, Order } from '../types';

/**
 * NotificationService - Handles all notifications across the platform
 * Manages notifications for Users, Vendors, and Riders
 */
class NotificationService {
  private notifications: Map<string, Notification[]> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private listeners: Map<string, ((data: unknown) => void)[]> = new Map();

  /**
   * Create a notification
   */
  createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Notification {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}`,
      createdAt: new Date(),
    };

    // Store by recipient (user, vendor, or rider)
    const recipientId = notification.userId || notification.vendorId || notification.riderId || '';
    const key = `notifications_${recipientId}`;
    
    if (!this.notifications.has(key)) {
      this.notifications.set(key, []);
    }
    this.notifications.get(key)?.push(newNotification);

    // Emit event for real-time updates
    this.emit(`notification_${recipientId}`, newNotification);

    return newNotification;
  }

  /**
   * Get notifications for a user/vendor/rider
   */
  getNotifications(userId: string, limit: number = 50): Notification[] {
    const key = `notifications_${userId}`;
    const notifications = this.notifications.get(key) || [];
    return notifications.slice(-limit).reverse();
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    for (const [, notifications] of this.notifications) {
      const notif = notifications.find(n => n.id === notificationId);
      if (notif) {
        notif.isRead = true;
        break;
      }
    }
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(userId: string): number {
    const key = `notifications_${userId}`;
    const notifications = this.notifications.get(key) || [];
    return notifications.filter(n => !n.isRead).length;
  }

  /**
   * Send a message
   */
  sendMessage(message: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Message {
    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store messages indexed by conversation (senderId_receiverId)
    const conversationKey = [message.senderId, message.receiverId].sort().join('_');
    const key = `messages_${conversationKey}`;

    if (!this.messages.has(key)) {
      this.messages.set(key, []);
    }
    this.messages.get(key)?.push(newMessage);

    // Also create a notification for the message
    const recipientId = message.receiverId;
    this.createNotification({
      userId: message.senderRole === 'user' ? undefined : (message.senderRole === 'vendor' ? undefined : undefined),
      vendorId: message.receiverId && message.senderRole !== 'vendor' ? message.receiverId : undefined,
      riderId: message.receiverId && message.senderRole !== 'rider' ? message.receiverId : undefined,
      orderId: message.orderId || '',
      type: 'message',
      title: 'New Message',
      message: message.content,
      isRead: false,
    });

    // Emit event for real-time updates
    this.emit(`message_${recipientId}`, newMessage);

    return newMessage;
  }

  /**
   * Get messages for a conversation
   */
  getMessages(userId1: string, userId2: string, limit: number = 100): Message[] {
    const conversationKey = [userId1, userId2].sort().join('_');
    const key = `messages_${conversationKey}`;
    const messages = this.messages.get(key) || [];
    return messages.slice(-limit);
  }

  /**
   * Order lifecycle notifications - USER PLACES ORDER
   */
  notifyOrderPlaced(order: Order, vendorId: string): Notification {
    return this.createNotification({
      vendorId: vendorId,
      orderId: order.id,
      type: 'order_placed',
      title: 'New Order Received',
      message: `${order.customerName} placed an order for ₱${order.total}`,
      data: {
        orderId: order.id,
        stallName: order.stallName,
        customerName: order.customerName,
        amount: order.total,
      },
      isRead: false,
    });
  }

  /**
   * VENDOR ACCEPTS ORDER
   */
  notifyOrderAccepted(order: Order, userId: string): Notification {
    return this.createNotification({
      userId: userId,
      orderId: order.id,
      type: 'order_accepted',
      title: 'Order Accepted',
      message: `${order.stallName} has accepted your order and is preparing it`,
      data: {
        orderId: order.id,
        stallName: order.stallName,
        estimatedTime: order.estimatedDeliveryTime,
      },
      isRead: false,
    });
  }

  /**
   * VENDOR REJECTS ORDER
   */
  notifyOrderRejected(order: Order, userId: string, reason?: string): Notification {
    return this.createNotification({
      userId: userId,
      orderId: order.id,
      type: 'order_rejected',
      title: 'Order Rejected',
      message: reason || `${order.stallName} has rejected your order`,
      isRead: false,
    });
  }

  /**
   * VENDOR UPDATES - PREPARING
   */
  notifyOrderPreparing(order: Order, userId: string): Notification {
    return this.createNotification({
      userId: userId,
      orderId: order.id,
      type: 'order_preparing',
      title: 'Order Being Prepared',
      message: `Your order is being prepared. Estimated time: ${order.estimatedDeliveryTime}`,
      data: {
        orderId: order.id,
        stallName: order.stallName,
      },
      isRead: false,
    });
  }

  /**
   * VENDOR UPDATES - READY FOR PICKUP
   */
  notifyOrderReady(order: Order, userId: string, riderId: string): Notification {
    // Notify user
    this.createNotification({
      userId: userId,
      orderId: order.id,
      type: 'order_ready',
      title: 'Order Ready',
      message: `Your order is ready! A rider will pick it up soon.`,
      data: {
        orderId: order.id,
        stallName: order.stallName,
      },
      isRead: false,
    });

    // Notify rider
    return this.createNotification({
      riderId: riderId,
      orderId: order.id,
      type: 'order_ready',
      title: 'Order Ready for Pickup',
      message: `Order from ${order.stallName} is ready for pickup at ${order.deliveryAddress}`,
      data: {
        orderId: order.id,
        stallName: order.stallName,
        customerName: order.customerName,
      },
      isRead: false,
    });
  }

  /**
   * RIDER ACCEPTS ORDER FROM USER
   */
  notifyRiderAccepted(order: Order, userId: string, riderName: string): void {
    // Notify user
    this.createNotification({
      userId: userId,
      orderId: order.id,
      type: 'rider_accepted',
      title: 'Rider Assigned',
      message: `${riderName} has accepted your order and is heading to ${order.stallName}`,
      data: {
        orderId: order.id,
        riderName: riderName,
      },
      isRead: false,
    });

    // Notify vendor
    this.createNotification({
      vendorId: order.vendorId,
      orderId: order.id,
      type: 'rider_accepted',
      title: 'Rider Assigned',
      message: `${riderName} is on the way to pick up the order for ${order.customerName}`,
      data: {
        orderId: order.id,
        riderName: riderName,
        customerName: order.customerName,
      },
      isRead: false,
    });
  }

  /**
   * RIDER PICKS UP ORDER FROM VENDOR
   */
  notifyRiderPickedUp(order: Order, userId: string, riderName: string): void {
    // Notify user
    this.createNotification({
      userId: userId,
      orderId: order.id,
      type: 'rider_on_way',
      title: 'Order Picked Up',
      message: `${riderName} has picked up your order and is on the way!`,
      data: {
        orderId: order.id,
        riderName: riderName,
      },
      isRead: false,
    });

    // Notify vendor
    this.createNotification({
      vendorId: order.vendorId,
      orderId: order.id,
      type: 'rider_on_way',
      title: 'Order Picked Up',
      message: `${riderName} has picked up the order for ${order.customerName}`,
      data: {
        orderId: order.id,
        riderName: riderName,
      },
      isRead: false,
    });
  }

  /**
   * ORDER DELIVERED
   */
  notifyOrderDelivered(order: Order, userId: string, riderName: string): void {
    // Notify user
    this.createNotification({
      userId: userId,
      orderId: order.id,
      type: 'order_delivered',
      title: 'Order Delivered',
      message: `Your order has been delivered by ${riderName}. Thank you for using our service!`,
      data: {
        orderId: order.id,
        stallName: order.stallName,
      },
      isRead: false,
    });

    // Notify vendor
    this.createNotification({
      vendorId: order.vendorId,
      orderId: order.id,
      type: 'order_delivered',
      title: 'Order Delivered',
      message: `Order #${order.id} for ${order.customerName} has been delivered`,
      data: {
        orderId: order.id,
        customerName: order.customerName,
      },
      isRead: false,
    });
  }

  /**
   * ORDER CANCELLED
   */
  notifyOrderCancelled(order: Order, userId: string, reason?: string): void {
    // Notify user
    this.createNotification({
      userId: userId,
      orderId: order.id,
      type: 'order_cancelled',
      title: 'Order Cancelled',
      message: reason || 'Your order has been cancelled',
      isRead: false,
    });

    // Notify vendor if applicable
    if (order.vendorId) {
      this.createNotification({
        vendorId: order.vendorId,
        orderId: order.id,
        type: 'order_cancelled',
        title: 'Order Cancelled',
        message: `Order #${order.id} from ${order.customerName} has been cancelled`,
        isRead: false,
      });
    }

    // Notify rider if applicable
    if (order.riderId) {
      this.createNotification({
        riderId: order.riderId,
        orderId: order.id,
        type: 'order_cancelled',
        title: 'Order Cancelled',
        message: `Order #${order.id} has been cancelled`,
        isRead: false,
      });
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(eventKey: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(eventKey)) {
      this.listeners.set(eventKey, []);
    }
    this.listeners.get(eventKey)?.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventKey);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit events to subscribers
   */
  private emit(eventKey: string, data: unknown): void {
    const callbacks = this.listeners.get(eventKey);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Clear all notifications for a user (for testing)
   */
  clearNotifications(userId: string): void {
    const key = `notifications_${userId}`;
    this.notifications.delete(key);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
