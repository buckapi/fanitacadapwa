import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private pb = new PocketBase('https://db.buckapi.site:8010');
  private collection = 'products';

  async getProducts(): Promise<Product[]> {
    return await this.pb.collection(this.collection).getFullList<Product>({
      sort: '-created'
      // No uses expand images si images será File
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

  getFileUrl(product: any, filename: string): string {
    return this.pb.files.getUrl(product, filename);
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
}