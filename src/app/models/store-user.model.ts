export interface StoreUserAdmin {
  id?: string;
  collectionId?: string;
  collectionName?: string;

  username?: string;
  verified?: boolean;
  emailVisibility?: boolean;
  email?: string;

  created?: string;
  updated?: string;

  name?: string;
  avatar?: string;

  type?: string;
  rolw?: 'client' | 'admin' | string;

  phone?: string;
status?: boolean;

  lat?: number;
  long?: number;
}