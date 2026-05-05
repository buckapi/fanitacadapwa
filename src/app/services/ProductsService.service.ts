import { Injectable, NgZone } from '@angular/core';
import PocketBase, { RecordModel } from 'pocketbase';
import { Product } from '../models/product.model';

type ProductRealtimeAction = 'create' | 'update' | 'delete';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private pb = new PocketBase('https://db.buckapi.site:8010');
  private collection = 'products';

  constructor(private ngZone: NgZone) {}

 
async getProducts(): Promise<Product[]> {
  return await this.pb.collection(this.collection).getFullList<Product>({
    sort: '-created',
    expand: 'images,categories'
  });
}
 async createProduct(data: FormData): Promise<Product> {
  return await this.pb.collection(this.collection).create<Product>(data);
}

async updateProduct(id: string, data: FormData): Promise<Product> {
  return await this.pb.collection(this.collection).update<Product>(id, data);
}

  async deleteProduct(id: string): Promise<boolean> {
    await this.pb.collection(this.collection).delete(id);
    return true;
  }
async createImage(file: File): Promise<any> {
  const formData = new FormData();

  // Este campo debe llamarse igual que el campo File en tu colección images
  formData.append('image', file);

  return await this.pb.collection('images').create(formData);
}
getImageRecordUrl(imageRecord: any): string | null {
  if (!imageRecord?.image) return null;

  return this.pb.files.getURL(imageRecord, imageRecord.image);
}
async getProductById(id: string): Promise<Product> {
  return await this.pb.collection(this.collection).getOne<Product>(id, {
    expand: 'images,categories'
  });
}
  async subscribeProducts(
    callback: (action: ProductRealtimeAction, record: Product) => void
  ): Promise<void> {
    await this.pb.collection(this.collection).subscribe('*', (e) => {
      this.ngZone.run(() => {
        callback(e.action as ProductRealtimeAction, e.record as unknown as Product);
      });
    });
  }

  unsubscribeProducts(): void {
    this.pb.collection(this.collection).unsubscribe('*');
  }

  getFileUrl(product: any, filename: string): string {
    return this.pb.files.getURL(product, filename);
  }

  generateSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async countProducts(): Promise<number> {
  const result = await this.pb.collection(this.collection).getList(1, 1);
  return result.totalItems;
}
async searchProducts(term: string): Promise<Product[]> {
  const cleanTerm = term.trim();

  if (!cleanTerm) return [];

  const safeTerm = cleanTerm.replace(/"/g, '\\"');

  return await this.pb.collection(this.collection).getFullList<Product>({
    sort: '-created',
    expand: 'images,categories',
    filter: `
      name ~ "${safeTerm}" ||
      description ~ "${safeTerm}" ||
      price ~ "${safeTerm}" ||
      categories.name ~ "${safeTerm}"
    `
  });
}
}