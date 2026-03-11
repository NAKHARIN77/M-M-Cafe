'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserOrders } from '@/lib/api/queries/orders';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket } from '@/lib/realtime/client';
import type { Order } from '@/types';

const statusLabels: Record<string, string> = {
  pending: 'รอชำระเงิน',
  paid: 'ชำระแล้ว',
  completed: 'สำเร็จ',
  cancelled: 'ยกเลิก',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  paid: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { data: orders, isLoading, error } = useUserOrders();
  const queryClient = useQueryClient();

  // Redirect admin users away from user orders page
  useEffect(() => {
    if (user?.role === 'admin') {
      router.push('/admin/orders');
    }
  }, [user, router]);

  useEffect(() => {
    const socket = connectSocket(token);
    if (!socket) return;

    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    };

    socket.on('order:created', refresh);
    const handleOrderUpdated = ({ order }: { order: Order }) => {
      refresh();

      // After admin confirms/completes an order, redirect user to review page (once per order).
      if (!user || user.role === 'admin') return;
      if (order.userId !== user.id) return;
      if (order.status !== 'paid' && order.status !== 'completed') return;

      const key = `review_redirected:${order.id}`;
      if (typeof window !== 'undefined' && window.sessionStorage.getItem(key)) return;
      if (typeof window !== 'undefined') window.sessionStorage.setItem(key, '1');

      router.push(`/reviews?orderId=${encodeURIComponent(order.id)}`);
    };
    socket.on('order:updated', handleOrderUpdated);
    return () => {
      socket.off('order:created', refresh);
      socket.off('order:updated', handleOrderUpdated);
    };
  }, [queryClient, router, token, user]);

  if (user?.role === 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">ไม่สามารถโหลดออเดอร์ได้ กรุณาลองใหม่อีกครั้ง</p>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="text-center mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            ออเดอร์ของฉัน
          </h1>
        </div>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="py-12 sm:py-16 text-center">
            <p className="text-muted-foreground text-base sm:text-lg">คุณยังไม่มีออเดอร์</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
      <div className="text-center mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          ออเดอร์ของฉัน
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">ประวัติการสั่งซื้อของคุณ</p>
      </div>
      <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
        {orders.map((order) => (
          <Card key={order.id} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <CardTitle className="text-base sm:text-lg mb-1 text-primary">
                    ออเดอร์ #{order.id.slice(0, 8)}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {new Date(order.createdAt).toLocaleString('th-TH')}
                  </CardDescription>
                </div>
                <Badge variant="default" className="bg-primary">
                  {statusLabels[order.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm sm:text-base">
                    <span className="flex-1 truncate mr-2">
                      {item.menuItem.name} x {item.quantity}
                    </span>
                    <span className="font-semibold whitespace-nowrap">{item.subtotal} บาท</span>
                  </div>
                ))}
                <div className="border-t pt-3 mt-3 flex justify-between items-center font-bold text-base sm:text-lg">
                  <span>ยอดรวม</span>
                  <span className="text-primary">{order.total} บาท</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
