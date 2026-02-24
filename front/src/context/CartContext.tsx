import React, { createContext, useContext, useState, useEffect } from 'react';
import { tokenStorage as storage } from '../utils/storage';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  maxStock?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, quantity?: number) => boolean;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const loadCart = async () => {
      const saved = await storage.getItem('cart');
      if (saved) setItems(JSON.parse(saved));
    };
    loadCart();
  }, []);

  useEffect(() => {
    const saveCart = async () => {
      if (items.length > 0) {
        await storage.setItem('cart', JSON.stringify(items));
      } else {
        await storage.deleteItem('cart');
      }
    };
    saveCart();
  }, [items]);

  const addToCart = (product: any, quantity: number = 1) => {
    let added = false;

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);
      const productStock = Number(product.available_quantity ?? Infinity);

      if (existingItem) {
        const nextQuantity = existingItem.quantity + quantity;
        const maxStock = Number.isFinite(productStock) ? productStock : existingItem.maxStock ?? Infinity;
        if (nextQuantity > maxStock) {
          return currentItems;
        }
        added = true;
        return currentItems.map((item) =>
          item.id === product.id ? { ...item, quantity: nextQuantity, maxStock } : item,
        );
      }

      if (quantity > productStock) {
        return currentItems;
      }

      added = true;
      return [
        ...currentItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity,
          maxStock: Number.isFinite(productStock) ? productStock : undefined,
        },
      ];
    });

    return added;
  };

  const removeFromCart = (productId: number) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== productId));
  };

  const clearCart = () => setItems([]);

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, totalAmount }}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};