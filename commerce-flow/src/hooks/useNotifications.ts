import { useState, useCallback, useEffect } from 'react';
import { Notification, NotificationType } from '@/types';
import { toast } from 'sonner';

// Mock notifications for demo
const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    type: 'low_stock_alert',
    title: 'Low Stock Alert',
    message: 'Wireless Mouse is running low (5 units remaining)',
    data: { productId: 'prod-1', currentStock: 5, threshold: 10 },
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: '2',
    userId: '1',
    type: 'payment_reminder',
    title: 'Payment Due',
    message: 'Invoice #INV-2024-0042 payment is overdue by 3 days',
    data: { invoiceId: 'inv-42', customerName: 'John Doe', amount: 1500 },
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '3',
    userId: '1',
    type: 'new_invoice',
    title: 'New Sale',
    message: 'New invoice #INV-2024-0045 created for ₹2,450',
    data: { invoiceId: 'inv-45', amount: 2450 },
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: '4',
    userId: '1',
    type: 'large_sale',
    title: 'Large Sale Alert',
    message: 'Invoice #INV-2024-0044 exceeds ₹10,000 threshold',
    data: { invoiceId: 'inv-44', amount: 15000 },
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const count = notifications.filter(n => !n.isRead).length;
    setUnreadCount(count);
  }, [notifications]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast for new notifications
    const toastType = getToastType(notification.type);
    toast[toastType](notification.title, {
      description: notification.message,
    });
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
}

function getToastType(type: NotificationType): 'success' | 'error' | 'warning' | 'info' {
  switch (type) {
    case 'low_stock_alert':
    case 'out_of_stock':
    case 'payment_reminder':
      return 'warning';
    case 'payment_received':
    case 'new_invoice':
    case 'large_sale':
      return 'success';
    default:
      return 'info';
  }
}
