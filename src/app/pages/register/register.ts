import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthPocketbaseService } from '../../services/auth-pocketbase.service';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  registerForm: FormGroup;
  submitted = false;
  loading = false;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthPocketbaseService
  ) {
    this.registerForm = this.fb.group(
      {
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        passwordConfirm: ['', Validators.required],
        terms: [false, Validators.requiredTrue]
      },
      { validators: this.passwordsMatch }
    );
  }

  passwordsMatch(control: AbstractControl) {
    const password = control.get('password')?.value;
    const passwordConfirm = control.get('passwordConfirm')?.value;

    return password === passwordConfirm ? null : { passwordsMismatch: true };
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  registerClient(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.registerForm.invalid) return;

    this.loading = true;

    const { name, email, password, passwordConfirm } = this.registerForm.value;

    this.auth.registerUser({
      name,
      email,
      password,
      passwordConfirm,
      type: 'client'
    }).subscribe({
      next: async () => {
        await this.auth.loginUser(email, password).toPromise();
        this.loading = false;
        await this.router.navigate(['/account']);
      },
      error: (error) => {
        console.error(error);
        this.loading = false;
        this.errorMessage = 'No se pudo crear la cuenta. Revisa los datos e intenta nuevamente.';
      }
    });
  }
}
