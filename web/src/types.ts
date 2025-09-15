
export type Role = "buyer" | "seller" | "admin";
export type SellerTier = 0 | 1 | 2;

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  sellerTier?: SellerTier | null;
}

export interface Category {
  id: string;
  name: string;
  image?: string | null;
  layout?: 'large' | 'small'; 
}

export interface Product {
  id: string;
  title: string;
  price: number;
  stlFile?: string | null;
  images: string[];
  sellerId: string;
  categoryId?: string | null;
}

export type OrderStatus = "created" | "assigned" | "in_progress" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "authorized" | "captured" | "refunded" | "failed";

export interface Order {
  id: string;
  productId: string;
  buyerId: string;
  sellerId?: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  amount: number;
  createdAt?: string;
}
