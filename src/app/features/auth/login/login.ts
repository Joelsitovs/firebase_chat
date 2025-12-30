import {Component, inject, signal} from '@angular/core';
import {AuthService} from '@/app/services/auth-service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  readonly auth = inject(AuthService);
  private router = inject(Router);

  readonly isLoading = signal(false);

  async LoginGoogle() {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    try {
      await this.auth.signInWithGoogle();
      await this.router.navigateByUrl('/chat');
    } finally {
      this.isLoading.set(false);
    }
  }
}
