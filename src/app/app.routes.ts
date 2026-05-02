import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { ProductDetail } from './pages/product-detail/product-detail';
import { Shop } from './pages/shop/shop';
import { About } from './pages/about/about';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { HomeDashboard } from './pages/dashboard/sections/home-dashboard/home-dashboard';
import { Products } from './pages/dashboard/sections/products/products';
import { Categories } from './pages/dashboard/sections/categories/categories';
import { Orders } from './pages/dashboard/sections/orders/orders';
import { Users } from './pages/dashboard/sections/users/users';
export const routes: Routes = [
    {
        path: '',
        component: Home,
    },
    {
        path: 'product-detail',
        component: ProductDetail,
    },
    {
        path: 'shop',
        component: Shop,
    },
    {
        path: 'about',
        component: About,
    },
    { path: 'login',
        component: Login,
    },
     {
    path: 'dashboard',
    component: Dashboard,
    children: [
      {
        path: '',
        component: HomeDashboard,
      },
      {
        path: 'products',
        component: Products,
      },
      {
        path: 'categories',
        component: Categories,
      },
      {
        path: 'orders',
        component: Orders,
      },
      {
        path: 'users',
        component: Users,
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
