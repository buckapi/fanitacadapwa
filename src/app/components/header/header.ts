import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthPocketbaseService } from '../../services/auth-pocketbase.service';
import { StoreUser } from '../../services/auth-pocketbase.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  user: StoreUser | null = null;
  showUserMenu = false;
constructor(
  public router: Router,
  public auth: AuthPocketbaseService
) { this.auth.currentUser$.subscribe(user => {
      this.user = user;
    });}
     toggleUserMenu(event: Event): void {
    event.preventDefault();
    this.showUserMenu = !this.showUserMenu;
  }

  async logout(): Promise<void> {
    this.showUserMenu = false;
    await this.auth.logout();
  }
}
