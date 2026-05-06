export interface OrderCustomer {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  notes?: string;
  [key: string]: any;
}

export interface OrderItem {
  id?: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
  [key: string]: any;
}

export interface Order {
  id?: string;
  collectionId?: string;
  collectionName?: string;
  created?: string;
  updated?: string;

  customer?: OrderCustomer;
  items?: OrderItem[];

  subtotal: number;
  shipping: number;
  total: number;

  status: string;
  user?: string;

  customerEmail?: string;
  customerName?: string;
}