import { Injectable, NgZone } from '@angular/core';
import PocketBase from 'pocketbase';
import { Category } from '../models/category.model';

type CategoryRealtimeAction = 'create' | 'update' | 'delete';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private pb = new PocketBase('https://db.buckapi.site:8010');
  private collection = 'categories';

  constructor(private ngZone: NgZone) {}

  async getCategories(): Promise<Category[]> {
    return await this.pb.collection(this.collection).getFullList<Category>({
      sort: 'order'
    });
  }

  async createCategory(data: Partial<Category>): Promise<Category> {
    return await this.pb.collection(this.collection).create<Category>(data);
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    return await this.pb.collection(this.collection).update<Category>(id, data);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.pb.collection(this.collection).delete(id);
  }
  async createImage(file: File): Promise<any> {
  const formData = new FormData();

  // OJO: este 'image' debe llamarse igual que el campo File en la colección images
  formData.append('image', file);

  return await this.pb.collection('images').create(formData);
}

  async subscribeCategories(
    callback: (action: CategoryRealtimeAction, record: Category) => void
  ): Promise<void> {
    await this.pb.collection(this.collection).subscribe('*', (e) => {
      this.ngZone.run(() => {
        callback(e.action as CategoryRealtimeAction, e.record as unknown as Category);
      });
    });
  }

  unsubscribeCategories(): void {
    this.pb.collection(this.collection).unsubscribe('*');
  }

  async countCategories(): Promise<number> {
  const result = await this.pb.collection(this.collection).getList(1, 1);
  return result.totalItems;
}
}