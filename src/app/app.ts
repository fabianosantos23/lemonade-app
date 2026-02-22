import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { StorageService } from './core/services/storage.service';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private storageService = inject(StorageService);
  protected readonly title = signal('Lemonade - Platform');

  ngOnInit(): void {
  /*   const accessToken = this.storageService.getCookie('accessToken');
    if (!accessToken) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.authService.getProfile().subscribe({
      next: (res) => {
        if (!res?.data) {
          return;
        }

        this.router.navigate(['/']);
      },
      error: (err) => {
        this.authService.logout();
      }
    }); */
  }
}
