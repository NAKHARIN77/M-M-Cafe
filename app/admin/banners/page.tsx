'use client';

import { useState } from 'react';
import { useBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from '@/lib/api/queries/promotions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Edit, Plus } from 'lucide-react';
import type { Banner } from '@/types';

export default function AdminBannersPage() {
  const { data: banners, isLoading } = useBanners();
  const { mutate: createBanner } = useCreateBanner();
  const { mutate: updateBanner } = useUpdateBanner();
  const { mutate: deleteBanner } = useDeleteBanner();
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      image: formData.get('image') as string,
      link: formData.get('link') as string,
      isActive: formData.get('isActive') === 'on',
      order: Number(formData.get('order')),
    };

    if (editingBanner) {
      updateBanner({ id: editingBanner.id, ...data });
    } else {
      createBanner(data);
    }
    setIsDialogOpen(false);
    setEditingBanner(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">จัดการ Banner</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingBanner(null)} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่ม Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>{editingBanner ? 'แก้ไข Banner' : 'เพิ่ม Banner ใหม่'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">หัวข้อ</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingBanner?.title}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">คำอธิบาย</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingBanner?.description}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">URL รูปภาพ</Label>
                <Input
                  id="image"
                  name="image"
                  type="url"
                  defaultValue={editingBanner?.image}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">ลิงก์</Label>
                <Input
                  id="link"
                  name="link"
                  type="url"
                  defaultValue={editingBanner?.link}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">ลำดับ</Label>
                <Input
                  id="order"
                  name="order"
                  type="number"
                  defaultValue={editingBanner?.order || 0}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  defaultChecked={editingBanner?.isActive ?? true}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isActive">ใช้งาน</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingBanner ? 'บันทึกการแก้ไข' : 'เพิ่ม Banner'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {banners?.map((banner) => (
          <Card key={banner.id} className="flex flex-col h-full hover:shadow-lg transition-shadow">
            {banner.image && (
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-40 sm:h-48 object-cover rounded-t-lg"
              />
            )}
            <CardHeader className="flex-1">
              <CardTitle className="text-base sm:text-lg">{banner.title}</CardTitle>
              <CardDescription className="text-sm line-clamp-2">{banner.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                ลำดับ: {banner.order}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setEditingBanner(banner);
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  แก้ไข
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบ Banner นี้?')) {
                      deleteBanner(banner.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  ลบ
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
// restrict cart access to logged-in users and add login redirect v2 