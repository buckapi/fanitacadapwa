export interface OrderCustomer {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  notes?: string;
  apartment?: string;
  country?: string;
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
  items?: OrderItem[] | string;

  subtotal?: number;
  shipping?: number;
  total?: number;

  status?: string;
  user?: string;

  customerEmail?: string;
  customerName?: string;

  paymentData?: any;
  authorizationCode?: string;
  paymentTypeCode?: string;
  cardNumber?: string | number;
  transactionDate?: string;
  responseCode?: number;
  installments?: number;

  trackingNumber?: string;
  shippingCompany?: string;
}