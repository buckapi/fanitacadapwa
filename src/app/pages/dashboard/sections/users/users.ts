import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { StoreUserAdmin } from '../../../../models/store-user.model';
import { AuthPocketbaseService } from '../../../../services/auth-pocketbase.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit, OnDestroy {
  users: StoreUserAdmin[] = [];
  loading = false;
  selectedUser: StoreUserAdmin | null = null;

  roleOptions = [
    { value: 'client', label: 'Cliente' },
    { value: 'admin', label: 'Administrador' },
  ];

  typeOptions = [
    { value: 'client', label: 'Cliente' },
    { value: 'admin', label: 'Administrador' },
  ];

  constructor(
    private authPocketbaseService: AuthPocketbaseService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.listenRealtimeUsers();
  }

  ngOnDestroy(): void {
    this.authPocketbaseService.unsubscribeUsers();
  }

  async loadUsers(): Promise<void> {
    this.loading = true;

    try {
      this.users = await this.authPocketbaseService.getUsers();
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      this.users = [];
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }

  async listenRealtimeUsers(): Promise<void> {
    try {
      await this.authPocketbaseService.subscribeUsers((action, record) => {
        if (action === 'create') {
          const exists = this.users.some(user => user.id === record.id);

          if (!exists) {
            this.users = [record, ...this.users];
          }
        }

        if (action === 'update') {
          this.users = this.users.map(user =>
            user.id === record.id ? record : user
          );

          if (this.selectedUser?.id === record.id) {
            this.selectedUser = record;
          }
        }

        if (action === 'delete') {
          this.users = this.users.filter(user => user.id !== record.id);

          if (this.selectedUser?.id === record.id) {
            this.selectedUser = null;
          }
        }

        this.cd.detectChanges();
      });
    } catch (error) {
      console.error('Error activando realtime de usuarios:', error);
    }
  }

  viewUser(user: StoreUserAdmin): void {
    this.selectedUser = user;
  }

  closeDetail(): void {
    this.selectedUser = null;
  }

  getAvatar(user: StoreUserAdmin): string {
    return this.authPocketbaseService.getAvatarUrl(user);
  }

  async changeStatus(user: StoreUserAdmin, event: Event): Promise<void> {
    const input = event.target as HTMLSelectElement;
    const status = input.value === 'true';

    if (!user.id) return;

    try {
      const updated = await this.authPocketbaseService.updateUserStatus(user.id, status);
      this.updateLocalUser(updated);

      Swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        timer: 1500,
        showConfirmButton: false,
      });

    } catch (error) {
      console.error('Error actualizando estado:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el estado del usuario.',
      });
    }
  }

  async changeRole(user: StoreUserAdmin, event: Event): Promise<void> {
  const input = event.target as HTMLSelectElement;
  const rolw = input.value as 'client' | 'admin';

  if (!user.id) return;

  try {
    const updated = await this.authPocketbaseService.updateUser(user.id, {
      type: rolw
    });

    this.updateLocalUser(updated);

    Swal.fire({
      icon: 'success',
      title: 'Rol actualizado',
      timer: 1500,
      showConfirmButton: false,
    });

  } catch (error) {
    console.error('Error actualizando rol:', error);

    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo actualizar el rol del usuario.',
    });
  }
}

  async deleteUser(user: StoreUserAdmin): Promise<void> {
    if (!user.id) return;

    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar usuario?',
      text: `Esta acción eliminará a ${user.name || user.email || 'este usuario'}.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
    });

    if (!result.isConfirmed) return;

    try {
      await this.authPocketbaseService.deleteUser(user.id);

      this.users = this.users.filter(item => item.id !== user.id);

      if (this.selectedUser?.id === user.id) {
        this.selectedUser = null;
      }

      Swal.fire({
        icon: 'success',
        title: 'Usuario eliminado',
        timer: 1500,
        showConfirmButton: false,
      });

    } catch (error) {
      console.error('Error eliminando usuario:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el usuario.',
      });
    }
  }

  private updateLocalUser(updated: StoreUserAdmin): void {
    this.users = this.users.map(user =>
      user.id === updated.id ? updated : user
    );

    if (this.selectedUser?.id === updated.id) {
      this.selectedUser = updated;
    }

    this.cd.detectChanges();
  }

  getRoleLabel(user: StoreUserAdmin): string {
    const role = user.rolw || user.type || 'client';
    return this.roleOptions.find(item => item.value === role)?.label || role;
  }

  formatDate(date?: string): string {
    if (!date) return 'Sin fecha';

    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
