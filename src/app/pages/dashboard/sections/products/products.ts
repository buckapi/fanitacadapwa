import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product } from '../../../../models/product.model';
import { ProductsService } from '../../../../services/ProductsService.service';

@Component({
  selector: 'app-products',
   standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  products: Product[] = [];
  productForm!: FormGroup;

  loading = false;
  saving = false;
  editing = false;
  selectedProductId: string | null = null;
  selectedFiles: File[] = [];
previewImages: string[] = [];
existingImages: string[] = [];
  constructor(
    private fb: FormBuilder,
    private productsService: ProductsService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadProducts();
  }

  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      editor: [''],
      unit: ['unidad'],
      timeToDeliver: [0],
      rating: [0],
      stock: [0, [Validators.required, Validators.min(0)]],

      isEssential: [false],
      isPopular: [false],
      isBestSelling: [false],
      isRecent: [false],

      urlImages: [''],
      description: [''],
      status: ['active'],
      featured: [false]
    });
  }

  async loadProducts(): Promise<void> {
    this.loading = true;

    try {
      this.products = await this.productsService.getProducts();
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      this.loading = false;
    }
  }

  async saveProduct(): Promise<void> {
  if (this.productForm.invalid) {
    this.productForm.markAllAsTouched();
    return;
  }

  this.saving = true;

  try {
    const formValue = this.productForm.value;

    const formData = new FormData();

    formData.append('name', formValue.name);
    formData.append('price', String(Number(formValue.price)));
    formData.append('editor', formValue.editor || '');
    formData.append('unit', formValue.unit || 'unidad');
    formData.append('timeToDeliver', String(Number(formValue.timeToDeliver || 0)));
    formData.append('rating', String(Number(formValue.rating || 0)));
    formData.append('stock', String(Number(formValue.stock || 0)));

    formData.append('isEssential', String(!!formValue.isEssential));
    formData.append('isPopular', String(!!formValue.isPopular));
    formData.append('isBestSelling', String(!!formValue.isBestSelling));
    formData.append('isRecent', String(!!formValue.isRecent));
    formData.append('featured', String(!!formValue.featured));

    formData.append('description', formValue.description || '');
    formData.append('status', formValue.status || 'active');
    formData.append('slug', this.productsService.generateSlug(formValue.name));

    this.selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    if (this.editing && this.selectedProductId) {
      await this.productsService.updateProduct(this.selectedProductId, formData);
    } else {
      await this.productsService.createProduct(formData);
    }

    await this.loadProducts();
    this.resetForm();

  } catch (error) {
    console.error('Error guardando producto:', error);
    alert('No se pudo guardar el producto. Revisa la consola.');
  } finally {
    this.saving = false;
  }
}

  editProduct(product: Product): void {
  this.editing = true;
  this.selectedProductId = product.id || null;

  this.productForm.patchValue({
    name: product.name || '',
    price: product.price || 0,
    editor: product.editor || '',
    unit: product.unit || 'unidad',
    timeToDeliver: product.timeToDeliver || 0,
    rating: product.rating || 0,
    stock: product.stock || 0,

    isEssential: product.isEssential || false,
    isPopular: product.isPopular || false,
    isBestSelling: product.isBestSelling || false,
    isRecent: product.isRecent || false,

    description: product.description || '',
    status: product.status || 'active',
    featured: product.featured || false
  });

  // Imágenes existentes guardadas en PocketBase
  this.existingImages = Array.isArray(product.images)
    ? product.images
    : [];

  // Limpia nuevas imágenes seleccionadas
  this.selectedFiles = [];
  this.previewImages = [];

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

  async deleteProduct(product: Product): Promise<void> {
    if (!product.id) return;

    const confirmDelete = confirm(`¿Eliminar el producto "${product.name}"?`);

    if (!confirmDelete) return;

    try {
      await this.productsService.deleteProduct(product.id);
      await this.loadProducts();
    } catch (error) {
      console.error('Error eliminando producto:', error);
    }
  }

  resetForm(): void {
    this.editing = false;
    this.selectedProductId = null;
    this.productForm.reset({
      name: '',
      price: 0,
      editor: '',
      unit: 'unidad',
      timeToDeliver: 0,
      rating: 0,
      stock: 0,
      isEssential: false,
      isPopular: false,
      isBestSelling: false,
      isRecent: false,
      urlImages: '',
      description: '',
      status: 'active',
      featured: false,
      selectedFiles: [],
      previewImages: [],
      existingImages: []
    });
  }
  onImagesSelected(event: Event): void {
  const input = event.target as HTMLInputElement;

  if (!input.files || input.files.length === 0) return;

  const files = Array.from(input.files);

  this.selectedFiles.push(...files);

  files.forEach(file => {
    const reader = new FileReader();

    reader.onload = () => {
      this.previewImages.push(reader.result as string);
    };

    reader.readAsDataURL(file);
  });

  input.value = '';
}

removeNewImage(index: number): void {
  this.selectedFiles.splice(index, 1);
  this.previewImages.splice(index, 1);
}

getProductImageUrl(product: any, filename: string): string {
  return this.productsService.getFileUrl(product, filename);
}

getFirstImage(product: any): string | null {
  if (!product.images || product.images.length === 0) return null;

  return this.productsService.getFileUrl(product, product.images[0]);
}
}