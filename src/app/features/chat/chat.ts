import {Component, effect, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild} from '@angular/core';
import {AuthService} from '@/app/services/auth-service';
import {Router} from '@angular/router';
import {AsyncPipe, DatePipe} from '@angular/common';
import {
  query,
  collection,
  orderBy,
  onSnapshot,
  Firestore,
  addDoc,
  serverTimestamp,
  Timestamp
} from '@angular/fire/firestore';
import {firstValueFrom, take} from 'rxjs';
import {FormsModule} from '@angular/forms';
import {Storage, ref, uploadBytes, getDownloadURL} from '@angular/fire/storage';


type ChatMessage = {
  id: string;
  text: string;
  imageUrl?: string | null;
  uid: string;
  email?: string | null;
  photoURL?: string | null;
  createdAt?: any;
  createdAtClient?: Timestamp;
};

@Component({
  selector: 'app-chat',
  imports: [
    AsyncPipe,
    FormsModule,
    DatePipe,
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private storage = inject(Storage);

  readonly user$ = this.auth.user$;

  readonly messages = signal<ChatMessage[]>([]);
  private unsubMessages?: () => void;
  message = '';
  readonly isSending = signal(false);

  constructor() {
    effect(() => {
      this.messages();

      setTimeout(() => {
        if (this.stickToBottom) {
          this.scrollToBottom();
        }
      }, 50);
    });
  }

  async ngOnInit() {
    const user = await firstValueFrom(this.user$.pipe(take(1)));

    if (!user) {
      await this.router.navigateByUrl('/login');
      return;
    }

    const ref = collection(this.firestore, 'messages');
    const q = query(ref, orderBy('createdAt', 'asc'));

    this.unsubMessages = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ChatMessage, 'id'>),
        }));

        this.messages.set(list);
      },
      (err) => console.error('🔥 Firestore onSnapshot error:', err)
    );
  }

  protected stickToBottom = true;
  @ViewChild('messagesEl') messagesEl?: ElementRef<HTMLElement>;

  onMessagesScroll(el: HTMLElement) {
    const threshold = 150;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    this.stickToBottom = distanceFromBottom < threshold;
  }

  protected scrollToBottom() {
    if (this.messagesEl) {
      const el = this.messagesEl.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  ngOnDestroy() {
    this.unsubMessages?.();
  }

  async logout() {
    try {
      await this.auth.signOut();
      await this.router.navigateByUrl('/login');
    } catch (e) {
      console.error('Error al cerrar sesión', e);
    }
  }

  autoGrow(event: Event) {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  async uploadImage(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const user = await firstValueFrom(this.user$.pipe(take(1)));
    if (!user) return;

    this.isSending.set(true);

    try {
      const filePath = `chats/${Date.now()}_${user.uid}_${file.name}`;
      const fileRef = ref(this.storage, filePath);
      await uploadBytes(fileRef, file);

      const imageUrl = await getDownloadURL(fileRef);

      await addDoc(collection(this.firestore, 'messages'), {
        text: '',
        imageUrl: imageUrl,
        uid: user.uid,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        createdAtClient: Timestamp.now(),
      });

    } catch (e) {
      console.error('Error al subir imagen:', e);
    } finally {
      this.isSending.set(false);
      event.target.value = ''; // Reset del input
    }
  }

  async sendMessage() {
    if (this.isSending()) return
    const text = this.message.trim();
    if (!text) return;
    this.stickToBottom = true;
    const user = await firstValueFrom(this.user$.pipe(take(1)));
    if (!user) {
      await this.router.navigateByUrl('/login');
      return;
    }
    this.isSending.set(true);
    this.message = ''
    try {
      await addDoc(collection(this.firestore, 'messages'), {
        text,
        uid: user.uid,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        createdAtClient: Timestamp.now(),
      });
    } catch (e) {
      console.error('Error enviando mensaje', e);
      this.message = text;
    } finally {
      this.isSending.set(false);
    }
  }
}
