import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import PocketBase, { RecordModel } from 'pocketbase';
import { BehaviorSubject, from, map, Observable, tap } from 'rxjs';

export type UserType = 'admin' | 'client';

export interface StoreUser {
  id: string;
  email: string;
  name?: string;
  username?: string;
  type: UserType;
  avatar?: string;
  created?: string;
  updated?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthPocketbaseService {
  public pb = new PocketBase('https://db.buckapi.site:8010');

  public currentUser: StoreUser | null = null;

  private currentUserSubject = new BehaviorSubject<StoreUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private router: Router) {
    this.restoreSession();
  }

  loginUser(email: string, password: string): Observable<any> {
    return from(this.pb.collection('users').authWithPassword(email, password)).pipe(
      map((authData) => {
        const pbUser = authData.record;

        const userTypeRaw = pbUser['type'];
        const userType = Array.isArray(userTypeRaw) ? userTypeRaw[0] : userTypeRaw;

        const user: StoreUser = {
          id: pbUser.id,
          email: pbUser['email'],
          name: pbUser['name'] || '',
          username: pbUser['username'] || '',
          type: userType || 'client',
          avatar: pbUser['avatar'] || '',
          created: pbUser['created'],
          updated: pbUser['updated'],
          status: pbUser['status'] || 'active'
        };

        return {
          ...authData,
          user
        };
      }),
      tap((authData) => {
        const user = authData.user;
        const token = authData.token;

        this.pb.authStore.clear();
        this.pb.authStore.save(token, authData.record);

        this.setSession(token, authData.record, user);
      })
    );
  }

  private setSession(token: string, record: RecordModel, user: StoreUser): void {
    this.currentUser = user;

    localStorage.setItem('accessToken', token);
    localStorage.setItem('record', JSON.stringify(record));
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userId', user.id);
    localStorage.setItem('type', user.type);
    localStorage.setItem('isLoggedin', 'true');

    this.currentUserSubject.next(user);
  }

  restoreSession(): void {
    try {
      const token = localStorage.getItem('accessToken');
      const recordString = localStorage.getItem('record');
      const userString = localStorage.getItem('user');

      if (!token || !recordString || !userString) return;

      const record = JSON.parse(recordString);
      const user = JSON.parse(userString);

      this.pb.authStore.save(token, record);
      this.currentUser = user;
      this.currentUserSubject.next(user);
    } catch (error) {
      this.logout();
    }
  }

  getCurrentUser(): StoreUser | null {
    if (this.currentUser) return this.currentUser;

    const userString = localStorage.getItem('user');

    if (!userString) return null;

    try {
      this.currentUser = JSON.parse(userString);
      return this.currentUser;
    } catch {
      return null;
    }
  }

  getUserId(): string {
    return localStorage.getItem('userId') || '';
  }

  getToken(): string {
    return localStorage.getItem('accessToken') || '';
  }

  isAuthenticated(): boolean {
    return this.pb.authStore.isValid && localStorage.getItem('isLoggedin') === 'true';
  }

  isAdmin(): boolean {
    return localStorage.getItem('type') === 'admin';
  }

  isClient(): boolean {
    return localStorage.getItem('type') === 'client';
  }

  async redirectByRole(): Promise<void> {
    const user = this.getCurrentUser();

    if (!this.isAuthenticated() || !user?.type) {
      await this.router.navigate(['/login']);
      return;
    }

    if (user.type === 'admin') {
      await this.router.navigate(['/dashboard']);
      return;
    }

    await this.router.navigate(['/']);
  }

  async logout(): Promise<void> {
    try {
      await this.pb.realtime.unsubscribe();
    } catch {}

    this.pb.authStore.clear();

    localStorage.removeItem('accessToken');
    localStorage.removeItem('record');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('type');
    localStorage.removeItem('isLoggedin');

    this.currentUser = null;
    this.currentUserSubject.next(null);

    await this.router.navigate(['/login']);
  }
  registerUser(data: {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  type: 'client' | 'admin';
}) {
  return new Observable<any>((observer) => {
    this.pb.collection('users').create(data).then(
      (record) => {
        observer.next(record);
        observer.complete();
      },
      (error) => observer.error(error)
    );
  });
}
async countClients(): Promise<number> {
  const result = await this.pb.collection('users').getList(1, 1, {
    filter: `type = "client"`
  });

  return result.totalItems;
}
}