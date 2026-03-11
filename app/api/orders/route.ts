import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, createOrder } from '@/lib/db/db';
import { verifyToken, getTokenFromRequest } from '@/lib/auth/jwt';
import { getMenuItemById } from '@/lib/db/db';
import type { OrderItem } from '@/types';
import { emitGlobal, emitToAdmins, emitToUser } from '@/lib/realtime/io';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Users can only see their own orders, admins see all
    const userId = payload.role === 'admin' ? undefined : payload.userId;
    const orders = await getAllOrders(userId);
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      );
    }

    // Build order items with menu item details
    const orderItems: OrderItem[] = [];
    let total = 0;

    for (const item of items) {
      // Validate item structure
      if (!item.menuItemId || typeof item.menuItemId !== 'string') {
        return NextResponse.json(
          { error: 'Invalid menu item ID' },
          { status: 400 }
        );
      }

      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Quantity must be a positive number' },
          { status: 400 }
        );
      }

      const menuItem = await getMenuItemById(item.menuItemId);
      if (!menuItem) {
        return NextResponse.json(
          { error: `Menu item ${item.menuItemId} not found` },
          { status: 404 }
        );
      }

      if (!menuItem.isAvailable) {
        return NextResponse.json(
          { error: `Menu item ${menuItem.name} is not available` },
          { status: 400 }
        );
      }

      const subtotal = menuItem.price * item.quantity;
      total += subtotal;

      orderItems.push({
        id: Date.now().toString() + Math.random(),
        menuItemId: menuItem.id,
        menuItem,
        quantity: item.quantity,
        price: menuItem.price,
        subtotal,
      });
    }

    const order = await createOrder({
      userId: payload.userId,
      items: orderItems,
      total,
      status: 'pending',
    });

    emitGlobal('order:created', { order });
    emitToAdmins('order:created', { order });
    emitToUser(payload.userId, 'order:created', { order });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
