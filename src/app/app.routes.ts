import {Routes} from '@angular/router';
import {authGuard, guestGuard} from '@/app/guards/auth-guard';

export const routes: Routes = [
    {
      path: '',
      pathMatch: 'full',
      redirectTo: 'login',
    },
    {
      path: 'login',
      loadComponent: () =>
        import('./features/auth/login/login').then(m => m.Login),
      canActivate: [guestGuard],
    },
    {
      path: 'chat',
      loadComponent: () =>
        import('./features/chat/chat').then(m => m.Chat),
      canActivate: [authGuard],
    }
  ]
;
