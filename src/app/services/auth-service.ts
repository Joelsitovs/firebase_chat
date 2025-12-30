import {inject, Injectable} from '@angular/core';
import {Auth, signInWithPopup, User, GoogleAuthProvider, authState} from '@angular/fire/auth';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);

  readonly user$: Observable<User | null> = authState(this.auth);

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    return await signInWithPopup(this.auth, provider)
  }

  async signOut() {
    return this.auth.signOut();
  }
}
