export interface Product {
  id?: string;
  name: string;
  price: number;
  editor?: string;
  unit?: string;
  timeToDeliver?: number;
  rating?: number;
  stock: number;

  isEssential?: boolean;
  isPopular?: boolean;
  isBestSelling?: boolean;
  isRecent?: boolean;

  categories?: string[];
  images?: string[];
  urlImages?: any;

  slug?: string;
  description?: string;
  status?: 'active' | 'inactive';
  featured?: boolean;

  created?: string;
  updated?: string;
}