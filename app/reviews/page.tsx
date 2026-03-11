'use client';

import { useReviews, useAverageRating, useCreateReview } from '@/lib/api/queries/reviews';
import { useUserOrders } from '@/lib/api/queries/orders';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Star } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/api/error';
import { useSearchParams } from 'next/navigation';

export default function ReviewsPage() {
  const { data: reviews, isLoading: reviewsLoading, error: reviewsError } = useReviews();
  const { data: ratingData, isLoading: ratingLoading, error: ratingError } = useAverageRating();
  const { mutate: createReview, isPending, error: createError } = useCreateReview();
  const { isAuthenticated } = useAuthStore();
  const { data: orders, isLoading: ordersLoading, error: ordersError } = useUserOrders();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const hasOrders = !!orders && orders.length > 0;
  // Treat "paid" as confirmed by admin in current flow.
  const canCreateReview =
    isAuthenticated && !!orders && orders.some((o) => o.status === 'paid' || o.status === 'completed');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateReview) {
      alert('คุณยังไม่สามารถให้รีวิวได้: ต้องมีออเดอร์และสถานะถูกยืนยันแล้วหรือเสร็จสิ้น');
      return;
    }
    createReview(
      { rating, comment },
      {
        onSuccess: () => {
          setComment('');
          setRating(5);
        },
        onError: (error: any) => {
          console.error('Create review error:', error);
          alert(error?.response?.data?.error || 'ไม่สามารถสร้างรีวิวได้ กรุณาลองใหม่อีกครั้ง');
        },
      }
    );
  };

  if (reviewsLoading || ratingLoading || (isAuthenticated && ordersLoading)) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      </div>
    );
  }

  if (reviewsError || ratingError || ordersError) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">ไม่สามารถโหลดรีวิวได้ กรุณาลองใหม่อีกครั้ง</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-5 sm:py-6 md:py-8 lg:py-12">
      <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12 fade-in">
        <h1 className="text-responsive-lg font-bold mb-2 sm:mb-3 gradient-text px-4">
          รีวิวและคะแนน
        </h1>
        <p className="text-responsive text-muted-foreground px-4">ความคิดเห็นจากลูกค้า</p>
      </div>

      {ratingData && ratingData.average !== undefined && ratingData.average !== null && (
        <Card className="mb-5 sm:mb-6 md:mb-8 border-2 border-border/50 rounded-2xl sm:rounded-3xl glass fade-in">
          <CardContent className="py-4 sm:py-5 md:py-6 px-4 sm:px-5 md:px-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 md:gap-6">
              <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold gradient-text">
                {typeof ratingData.average === 'number' ? ratingData.average.toFixed(1) : '0.0'}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 transition-colors ${
                        star <= Math.round(ratingData.average || 0)
                          ? 'fill-primary text-primary'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                  จาก {ratingData.count || 0} รีวิว
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isAuthenticated && !canCreateReview && (
        <Card className="mb-5 sm:mb-6 md:mb-8 border-2 border-border/50 rounded-2xl sm:rounded-3xl glass fade-in">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl text-primary">ไม่สามารถเขียนรีวิวได้</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              คุณสามารถเขียนรีวิวได้เมื่อมีประวัติการสั่งซื้อ และออเดอร์ถูกแอดมินยืนยันแล้ว (ชำระแล้ว) หรือเสร็จสิ้น
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasOrders ? (
              <p className="text-sm text-muted-foreground">ตอนนี้ยังไม่มีออเดอร์ในระบบของคุณ</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                ตอนนี้ออเดอร์ของคุณยังอยู่ในสถานะที่ยังไม่ยืนยัน กรุณารอแอดมินยืนยันก่อน
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {canCreateReview && (
        <Card className="mb-5 sm:mb-6 md:mb-8 border-2 border-border/50 rounded-2xl sm:rounded-3xl glass fade-in">
          {createError && (
            <div className="p-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                {getApiErrorMessage(createError, 'ไม่สามารถสร้างรีวิวได้ กรุณาลองใหม่อีกครั้ง')}
              </p>
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl text-primary">เขียนรีวิว</CardTitle>
            {orderId && (
              <CardDescription className="text-xs sm:text-sm">
                ออเดอร์ของคุณได้รับการยืนยันแล้ว คุณสามารถให้รีวิวได้เลย (Order ID: {orderId.slice(0, 8)})
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label className="text-sm sm:text-base font-medium mb-2 sm:mb-3 block">คะแนน</label>
                <div className="flex gap-1 sm:gap-2 justify-center sm:justify-start">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-all duration-300 hover:scale-110"
                      aria-label={`ให้คะแนน ${star} ดาว`}
                    >
                      <Star
                        className={`h-7 w-7 sm:h-8 sm:w-8 ${
                          star <= rating
                            ? 'fill-primary text-primary'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm sm:text-base font-medium mb-2 sm:mb-3 block">ความคิดเห็น</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="เขียนรีวิวของคุณ..."
                  rows={4}
                  className="resize-none"
                />
              </div>
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                {isPending ? 'กำลังส่ง...' : 'ส่งรีวิว'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 px-2 sm:px-4">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold gradient-text mb-4 sm:mb-5">รีวิวล่าสุด</h2>
        {reviews && reviews.length > 0 ? (
          reviews.map((review) => (
            <Card key={review.id} className="border-2 border-border/50 rounded-xl sm:rounded-2xl glass card-hover fade-in">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                  <CardTitle className="text-base sm:text-lg">
                    {review.user?.name || 'ผู้ใช้'}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
                          star <= review.rating
                            ? 'fill-primary text-primary'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <CardDescription className="text-xs sm:text-sm">
                  {new Date(review.createdAt).toLocaleDateString('th-TH')}
                </CardDescription>
              </CardHeader>
              {review.comment && (
                <CardContent>
                  <p className="text-sm sm:text-base leading-relaxed">{review.comment}</p>
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 sm:py-12 text-center">
              <p className="text-muted-foreground text-sm sm:text-base">ยังไม่มีรีวิว</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
