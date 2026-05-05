import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Shop } from './pages/shop/shop';
import { About } from './pages/about/about';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { HomeDashboard } from './pages/dashboard/sections/home-dashboard/home-dashboard';
import { Products } from './pages/dashboard/sections/products/products';
import { Categories } from './pages/dashboard/sections/categories/categories';
import { Orders } from './pages/dashboard/sections/orders/orders';
import { Users } from './pages/dashboard/sections/users/users';
import { ProductDetail } from './pages/product-detail/product-detail';
import { Contact } from './pages/contact/contact';
import { Cart} from './pages/cart/cart';
import { Checkout } from './pages/checkout/checkout';
import { Register } from './pages/register/register';
import { Account } from './pages/dashboard/sections/account/account';
import { Wishlist } from './pages/dashboard/sections/wishlist/wishlist';
import { OrdersClient } from './pages/dashboard/sections/orders-client/orders-client';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'product-detail/:id',
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
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'contact',
    component: Contact,
  },
  {
    path: 'cart',
    component: Cart,
  },
  {
    path: 'checkout',
    component: Checkout,
  },
  {
    path: 'register',
    component: Register,
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
      {
        path: 'account',
        component: Account,
      },
      {
        path: 'wishlist',
        component: Wishlist,
      },
      {
        path: 'orders-client',
        component: OrdersClient,
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
