import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import PocketBase from 'pocketbase';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthPocketbaseService } from '../../services/auth-pocketbase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;
  submitted = false;
  loading = false;
  showPassword = false;
  errorMessage = '';

  private pb = new PocketBase('https://db.buckapi.site:8010');

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthPocketbaseService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

/*   loginAdmin(): void {
  this.submitted = true;
  this.errorMessage = '';

  if (this.loginForm.invalid) return;

  this.loading = true;

  const { email, password } = this.loginForm.value;

  this.auth.loginUser(email, password).subscribe({
    next: async ({ user }) => {
      if (user.type !== 'admin') {
        await this.auth.logout();
        this.errorMessage = 'No tienes permisos para acceder al panel administrativo.';
        this.loading = false;
        return;
      }

if (user.type === 'admin') {
  await this.router.navigate(['/dashboard']);
  return;
}

await this.router.navigate(['/']);    },
    error: () => {
      this.errorMessage = 'Credenciales incorrectas o usuario no autorizado.';
      this.loading = false;
    }
  });
} */
login(): void {
  this.submitted = true;
  this.errorMessage = '';

  if (this.loginForm.invalid) return;

  this.loading = true;

  const { email, password } = this.loginForm.value;

  this.auth.loginUser(email, password).subscribe({
    next: async ({ user }) => {
      this.loading = false;

      if (user.type === 'admin') {
        await this.router.navigate(['/dashboard']);
        return;
      }

      if (user.type === 'client') {
        await this.router.navigate(['/account']);
        return;
      }

      await this.router.navigate(['/']);
    },
    error: () => {
      this.errorMessage = 'Credenciales incorrectas.';
      this.loading = false;
    }
  });
}

}
