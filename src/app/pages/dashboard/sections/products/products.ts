import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product } from '../../../../models/product.model';
import { ProductsService } from '../../../../services/ProductsService.service';
import { CategoriesService } from '../../../../services/CategoriesService.service';
import Swal from 'sweetalert2';
import { Category } from '../../../../models/category.model';
@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit, OnDestroy {
  products: Product[] = [];
  productForm!: FormGroup;
  parentCategories: any[] = [];
  subcategories: any[] = [];
  filteredSubcategories: any[] = [];
  selectedSubcategories: string[] = [];
  loading = false;
  saving = false;
  editing = false;
  selectedProductId: string | null = null;
  selectedFiles: File[] = [];
  previewImages: string[] = [];
  existingImages: string[] = [];
  categories: Category[] = [];
  selectedCategories: string[] = [];
  existingImageRecords: any[] = [];
  availableSizes: { value: string; label: string }[] = [];

sizeOptions = {
  ropaSuperior: [
    { value: 'XS', label: 'XS - 34/36' },
    { value: 'S', label: 'S - 38/40' },
    { value: 'M', label: 'M - 42/44' },
    { value: 'L', label: 'L - 44/46' },
    { value: 'XL', label: 'XL - 48/50' },
  ],

  pantalones: [
    { value: '34-36', label: '34/36 - XS' },
    { value: '38-40', label: '38/40 - S' },
    { value: '42-44', label: '42/44 - M' },
    { value: '46-48', label: '46/48 - L' },
    { value: '50+', label: '50+ - XL' },
  ],

  medias: [
    { value: 'S/M', label: 'S/M - 35/39 CL' },
    { value: 'L/XL', label: 'L/XL - 40/45 CL' },
  ],

  general: [
    { value: 'XS', label: 'XS' },
    { value: 'S', label: 'S' },
    { value: 'M', label: 'M' },
    { value: 'L', label: 'L' },
    { value: 'XL', label: 'XL' },
    { value: 'Única', label: 'Única' },
  ]
};
  constructor(
    private fb: FormBuilder,
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadProducts();
    this.listenRealtimeProducts();
    this.loadCategories();
  }
  ngOnDestroy(): void {
    this.productsService.unsubscribeProducts();
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
  category: ['', Validators.required],
  subcategories: [[]],
      isEssential: [false],
      isPopular: [false],
      isBestSelling: [false],
      isRecent: [false],
      size: [''],
      color: [''],
      urlImages: [''],
      description: [''],
      status: ['active'],
      featured: [false]
    });
  }
 
  async loadCategories(): Promise<void> {
  const records = await this.categoriesService.getCategories();

  this.categories = records;

  this.parentCategories = records.filter((cat: any) => !cat.parent);
  this.subcategories = records.filter((cat: any) => cat.parent);
}
  async loadProducts(): Promise<void> {
    this.loading = true;
    this.cd.detectChanges();

    try {
      const records = await this.productsService.getProducts();

      console.log('Productos cargados:', records);

      this.products = records;
    } catch (error) {
      console.error('Error cargando productos:', error);
      this.products = [];
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }
  async listenRealtimeProducts(): Promise<void> {
    try {
      await this.productsService.subscribeProducts((action, record) => {
        if (action === 'create') {
          const exists = this.products.some(product => product.id === record.id);

          if (!exists) {
            this.products = [record, ...this.products];
          }
        }

        if (action === 'update') {
          this.products = this.products.map(product =>
            product.id === record.id ? record : product
          );
        }

        if (action === 'delete') {
          this.products = this.products.filter(product => product.id !== record.id);
        }

        this.cd.detectChanges();
      });
    } catch (error) {
      console.error('Error activando realtime de productos:', error);
    }
  }
  onParentCategoryChange(event: Event): void {
  const input = event.target as HTMLSelectElement;
  const parentId = input.value;

  this.filteredSubcategories = this.subcategories.filter((sub: any) => sub.parent === parentId);

  this.selectedSubcategories = [];

  this.productForm.patchValue({
    subcategories: [],
    size: ''
  });

  this.updateAvailableSizes(parentId);
}
updateAvailableSizes(categoryId: string): void {
  const category = this.parentCategories.find((cat: any) => cat.id === categoryId);
  const name = category?.name?.toLowerCase() || '';

  if (name.includes('camiseta') || name.includes('chaqueta')) {
    this.availableSizes = this.sizeOptions.ropaSuperior;
    return;
  }

  if (name.includes('pantalon') || name.includes('pantalón') || name.includes('short')) {
    this.availableSizes = this.sizeOptions.pantalones;
    return;
  }

  if (name.includes('media') || name.includes('calcetin') || name.includes('calcetín')) {
    this.availableSizes = this.sizeOptions.medias;
    return;
  }

  this.availableSizes = this.sizeOptions.general;
}
onSubcategoryToggle(event: Event): void {
  const input = event.target as HTMLInputElement;
  const id = input.value;

  if (input.checked) {
    this.selectedSubcategories.push(id);
  } else {
    this.selectedSubcategories = this.selectedSubcategories.filter(subId => subId !== id);
  }

  this.productForm.patchValue({
    subcategories: this.selectedSubcategories
  });
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
    formData.append('size', formValue.size || '');
    formData.append('color', formValue.color || '');

    formData.append('isEssential', String(!!formValue.isEssential));
    formData.append('isPopular', String(!!formValue.isPopular));
    formData.append('isBestSelling', String(!!formValue.isBestSelling));
    formData.append('isRecent', String(!!formValue.isRecent));
    formData.append('featured', String(!!formValue.featured));

    formData.append('description', formValue.description || '');
    formData.append('status', formValue.status || 'active');
    formData.append('slug', this.productsService.generateSlug(formValue.name));

    // Categoría padre
    if (formValue.category) {
      formData.append('categories', formValue.category);
    }

    // Subcategorías múltiples
    this.selectedSubcategories.forEach(subcategoryId => {
      formData.append('subcategories', subcategoryId);
    });

    const imageIds: string[] = [...this.existingImages];

    for (const file of this.selectedFiles) {
      const imageRecord = await this.productsService.createImage(file);
      imageIds.push(imageRecord.id);
    }

    imageIds.forEach(imageId => {
      formData.append('images', imageId);
    });

    let savedProduct: Product;

    if (this.editing && this.selectedProductId) {
      savedProduct = await this.productsService.updateProduct(this.selectedProductId, formData);
    } else {
      savedProduct = await this.productsService.createProduct(formData);
    }

    const expandedProduct = await this.productsService.getProductById(savedProduct.id!);

    const exists = this.products.some(product => product.id === expandedProduct.id);

    if (exists) {
      this.products = this.products.map(product =>
        product.id === expandedProduct.id ? expandedProduct : product
      );
    } else {
      this.products = [expandedProduct, ...this.products];
    }

    this.cd.detectChanges();

    this.resetForm();

    Swal.fire({
      icon: 'success',
      title: 'Producto guardado',
      text: 'El producto se guardó correctamente.',
    });

  } catch (error) {
    console.error('Error guardando producto:', error);

    Swal.fire({
      icon: 'error',
      title: 'Error al guardar el producto',
      text: 'No se pudo guardar el producto. Revisa la consola.',
    });

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
      categories: Array.isArray(product.categories) ? product.categories : [],
      isEssential: product.isEssential || false,
      isPopular: product.isPopular || false,
      isBestSelling: product.isBestSelling || false,
      isRecent: product.isRecent || false,

      description: product.description || '',
      status: product.status || 'active',
      featured: product.featured || false
    });

    this.existingImages = Array.isArray(product.images)
      ? product.images
      : [];

    this.existingImageRecords = Array.isArray((product as any).expand?.images)
      ? (product as any).expand.images
      : [];

    this.selectedFiles = [];
    this.previewImages = [];

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  getImageRecordUrl(imageRecord: any): string | null {
    return this.productsService.getImageRecordUrl(imageRecord);
  }
  getFirstProductImage(product: any): string | null {
    const expandedImages = product.expand?.images;

    if (!expandedImages) return null;

    const firstImage = Array.isArray(expandedImages)
      ? expandedImages[0]
      : expandedImages;

    if (!firstImage) return null;

    return this.productsService.getImageRecordUrl(firstImage);
  }

  removeExistingImage(index: number): void {
    const imageRecord = this.existingImageRecords[index];

    this.existingImageRecords.splice(index, 1);

    if (imageRecord?.id) {
      this.existingImages = this.existingImages.filter(id => id !== imageRecord.id);
    }

    this.cd.detectChanges();
  }
  getImageUrlById(imageId: string): string {
    return `https://db.buckapi.site:8010/api/files/images/${imageId}/image`;
  }
  async deleteProduct(product: Product): Promise<void> {
    if (!product.id) return;

    const confirmDelete = confirm(`¿Eliminar el producto "${product.name}"?`);

    if (!confirmDelete) return;

    try {
      await this.productsService.deleteProduct(product.id);
    } catch (error) {
      console.error('Error eliminando producto:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al eliminar el producto',
        text: 'No se pudo eliminar el producto. Revisa la consola.',
      });
    }
    Swal.fire({
      icon: 'success',
      title: 'Producto eliminado',
      text: 'El producto se eliminó correctamente.',
    });
  }
  getCategoryNames(product: Product): string {
    if (!product.categories || product.categories.length === 0) {
      return 'Sin categoría';
    }

    return product.categories
      .map(categoryId => this.categories.find(cat => cat.id === categoryId)?.name)
      .filter(Boolean)
      .join(', ') || 'Sin categoría';
  }
  onCategoryToggle(event: any) {
    const value = event.target.value;

    if (event.target.checked) {
      this.selectedCategories.push(value);
    } else {
      this.selectedCategories = this.selectedCategories.filter(id => id !== value);
    }

    this.productForm.patchValue({
      categories: this.selectedCategories
    });
  }
  resetForm(): void {
    this.editing = false;
    this.selectedProductId = null;
    this.selectedFiles = [];
    this.previewImages = [];
    this.existingImages = [];
    this.selectedCategories = [];
    this.existingImageRecords = [];
    this.productForm.reset({
      name: '',
      price: 0,
      editor: '',
      unit: 'unidad',
      timeToDeliver: 0,
      rating: 0,
      stock: 0,
      categories: [],
      isEssential: false,
      isPopular: false,
      isBestSelling: false,
      isRecent: false,
      urlImages: '',
      description: '',
      status: 'active',
      featured: false
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