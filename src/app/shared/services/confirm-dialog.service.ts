import { ApplicationRef, DOCUMENT, EnvironmentInjector, Injectable, ComponentRef, inject, createComponent } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';

export interface ConfirmDialogConfig {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private appRef = inject(ApplicationRef);
  private envInjector = inject(EnvironmentInjector);
  private doc = inject(DOCUMENT);

  open(config: ConfirmDialogConfig = {}): Observable<boolean> {
    const subject = new Subject<boolean>();
    const host = this.doc.createElement('div');
    this.doc.body.appendChild(host);

    const ref: ComponentRef<ConfirmDialogComponent> = createComponent(ConfirmDialogComponent, {
      environmentInjector: this.envInjector,
      hostElement: host
    });

    this.appRef.attachView(ref.hostView);
    if (config.title) ref.setInput('title', config.title);
    if (config.message) ref.setInput('message', config.message);
    if (config.confirmText) ref.setInput('confirmText', config.confirmText);
    if (config.cancelText) ref.setInput('cancelText', config.cancelText);

    const cleanup = () => {
      setTimeout(() => {
        this.appRef.detachView(ref.hostView);
        ref.destroy();
        host.remove();
      }, 150);
    };

    const sub1 = ref.instance.confirm.subscribe(() => {
      try { config.onConfirm?.(); } catch {}
      subject.next(true);
      subject.complete();
      cleanup();
      sub1.unsubscribe();
      sub2.unsubscribe();
    });

    const sub2 = ref.instance.cancel.subscribe(() => {
      try { config.onCancel?.(); } catch {}
      subject.next(false);
      subject.complete();
      cleanup();
      sub1.unsubscribe();
      sub2.unsubscribe();
    });

    return subject.asObservable();
  }
}
