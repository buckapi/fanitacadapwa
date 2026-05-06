import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Category } from '../../../../models/category.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoriesService } from '../../../../services/CategoriesService.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories implements OnInit, OnDestroy {

  categories: Category[] = [];
  categoryForm!: FormGroup;
  loading = false;
  saving = false;
  editing = false;
  selectedId: string | null = null;
  selectedImageFile: File | null = null;
  previewImage: string | null = null;
  parentCategories: Category[] = [];
  selectedSubcategories: string[] = [];
  constructor(
    private fb: FormBuilder,
    private categoriesService: CategoriesService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    this.listenRealtimeCategories();
    this.cdr.detectChanges();
  }

  initForm() {
  this.categoryForm = this.fb.group({
    name: ['', Validators.required],
    parent: [''],
    order: [0],
    active: [true],
    image: ['']
  });
}

  async loadCategories(): Promise<void> {
    this.loading = true;
    this.cdr.detectChanges();

    try {
      const records = await this.categoriesService.getCategories();

      this.categories = records.sort((a, b) => {
        const aParent = a.parent ? 1 : 0;
        const bParent = b.parent ? 1 : 0;

        if (aParent !== bParent) return aParent - bParent;

        return (a.order || 0) - (b.order || 0);
      });

      this.parentCategories = this.categories.filter(cat => !cat.parent);

    } catch (error) {
      console.error('Error cargando categorías:', error);
      this.categories = [];
      this.parentCategories = [];
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
  async listenRealtimeCategories(): Promise<void> {
    try {
      await this.categoriesService.subscribeCategories((action, record) => {
        if (action === 'create') {
          const exists = this.categories.some(cat => cat.id === record.id);

          if (!exists) {
            this.categories = [...this.categories, record]
              .sort((a, b) => (a.order || 0) - (b.order || 0));
          }
        }

        if (action === 'update') {
          this.categories = this.categories
            .map(cat => cat.id === record.id ? record : cat)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        if (action === 'delete') {
          this.categories = this.categories.filter(cat => cat.id !== record.id);
        }

        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error activando realtime de categorías:', error);
    }
  }
  ngOnDestroy(): void {
    this.categoriesService.unsubscribeCategories();
  }

 async saveCategory() {
  if (this.categoryForm.invalid) {
    this.categoryForm.markAllAsTouched();
    return;
  }

  this.saving = true;

  try {

    let imageId = this.categoryForm.value.image || '';

    if (this.selectedImageFile) {
      const imageRecord = await this.categoriesService.createImage(this.selectedImageFile);
      imageId = imageRecord.id;
    }

    const formValue = this.categoryForm.value;

    const data = {
      name: formValue.name,
      parent: formValue.parent || '',
      order: formValue.order || 0,
      active: formValue.active,
      image: imageId
    };

    let savedCategory: any;

    // EDITAR
    if (this.editing && this.selectedId) {

      savedCategory = await this.categoriesService.updateCategory(
        this.selectedId,
        data
      );

      // crear subcategorías si existen
      if (!formValue.parent && this.selectedSubcategories.length > 0) {
        await this.createSubcategoriesForParent(this.selectedId);
      }

    }

    // CREAR
    else {

      savedCategory = await this.categoriesService.createCategory(data);

      // crear subcategorías relacionadas
      if (!formValue.parent && this.selectedSubcategories.length > 0) {

        await this.createSubcategoriesForParent(savedCategory.id);

      }

    }

    this.resetForm();

    await this.loadCategories();

  } catch (error) {

    console.error('Error guardando categoría', error);

  } finally {

    this.saving = false;

  }
}
getSubcategories(parentId: string): Category[] {
  return this.categories.filter(cat => cat.parent === parentId);
}
async createSubcategoriesForParent(parentId: string): Promise<void> {
  for (const subName of this.selectedSubcategories) {
    const alreadyExists = this.categories.some(cat =>
      cat.parent === parentId &&
      cat.name?.toLowerCase().trim() === subName.toLowerCase().trim()
    );

    if (!alreadyExists) {
      await this.categoriesService.createCategory({
        name: subName,
        parent: parentId,
        order: 0,
        active: true,
        image: ''
      });
    }
  }
}
  editCategory(cat: Category) {
    this.editing = true;
    this.selectedId = cat.id || null;

    this.categoryForm.patchValue({
      name: cat.name,
      parent: cat.parent || '',
      order: cat.order || 0,
      active: cat.active ?? true,
      image: cat.image || ''
    });

    this.previewImage = cat.image ? this.getImageUrl(cat.image) : null;
  }
  getImageUrl(imageId: string): string {
    return `https://db.buckapi.site:8010/api/files/images/${imageId}/image`;
  }

  async deleteCategory(cat: Category) {
    if (!cat.id) return;

    const id = cat.id; // ahora TS sabe que es string

    Swal.fire({
      title: '¿Eliminar categoría?',
      text: `¿Estás seguro de eliminar la categoría "${cat.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.categoriesService.deleteCategory(id).then(() => {

        });
      }
    });
  }
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    this.selectedImageFile = file;

    const reader = new FileReader();

    reader.onload = () => {
      this.previewImage = reader.result as string;
      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);

    input.value = '';
  }
  resetForm() {
    this.editing = false;
    this.selectedId = null;
    this.selectedImageFile = null;
    this.previewImage = null;
    this.selectedSubcategories = [];
    this.categoryForm.reset({
      name: '',
      parent: '',
      order: 0,
      active: true,
      image: ''
    });
  }
  getParentName(parentId: string): string {
    return this.categories.find(cat => cat.id === parentId)?.name || 'Sin categoría';
  }
  removeImage(): void {
    this.selectedImageFile = null;
    this.previewImage = null;

    this.categoryForm.patchValue({
      image: ''
    });
  }
  onSubcategoryToggle(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (input.checked) {
      this.selectedSubcategories.push(value);
    } else {
      this.selectedSubcategories = this.selectedSubcategories.filter(item => item !== value);
    }
  }
}