export interface Category {
  id?: string;

  name: string;

  types?: string;        // relation → guarda ID
  image?: string;        // relation → guarda ID

  order?: number;
  active?: boolean;

  parent?: string;

  created?: string;
  updated?: string;
}