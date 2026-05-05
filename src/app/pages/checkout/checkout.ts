import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CartItem, CartService } from '../../services/cart.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  cartItems: CartItem[] = [];
  subtotal = 0;
  shipping = 0;
  total = 0;

  checkoutForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public cartService: CartService
  ) {
    this.checkoutForm = this.fb.group({
      contact: ['', [Validators.required]],
      newsletter: [false],

      country: ['Chile', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      company: [''],
      address: ['', Validators.required],
      apartment: [''],
      city: ['', Validators.required],
      postalCode: [''],
      phone: ['', Validators.required],
      saveInfo: [false],

      shippingMethod: ['santiago', Validators.required],
      paymentMethod: ['transferencia', Validators.required],
      billingAddress: ['same', Validators.required],

      note: [''],
      terms: [false, Validators.requiredTrue]
    });

    this.cartService.items$.subscribe(items => {
      this.cartItems = items;
      this.subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
      this.calculateTotals();
    });

    this.checkoutForm.get('shippingMethod')?.valueChanges.subscribe(() => {
      this.calculateTotals();
    });
  }

  calculateTotals(): void {
    const shippingMethod = this.checkoutForm.get('shippingMethod')?.value;

    if (shippingMethod === 'santiago') {
      this.shipping = 0;
    } else {
      this.shipping = 5000;
    }

    this.total = this.subtotal + this.shipping;
  }

  completeOrder(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const orderData = {
      customer: this.checkoutForm.value,
      items: this.cartItems,
      subtotal: this.subtotal,
      shipping: this.shipping,
      total: this.total,
      status: 'pendiente'
    };

    console.log('Orden lista:', orderData);

    // Luego aquí conectamos PocketBase / pago / WhatsApp / email
  }
}
