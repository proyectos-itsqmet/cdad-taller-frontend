import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideLock,
  lucideMonitor,
  lucideShield,
  lucideTrash2,
} from '@ng-icons/lucide';
import { AuthService } from '../../../core/auth/auth.service';
import { UserAvatar } from '../../../shared/ui/user-avatar/user-avatar';

/**
 * Account — "Administrar cuenta". Profile fields are pre-populated from the
 * authenticated user (`AuthService.currentUser`). Only the password-change
 * action is wired to the backend; the remaining actions (foto, sesiones,
 * cerrar cuenta) stay inert mocks, disabled with an explanatory tooltip.
 */
@Component({
  selector: 'kubo-settings-account',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, UserAvatar],
  providers: [provideIcons({ lucideShield, lucideLock, lucideMonitor, lucideTrash2 })],
  host: { class: 'block' },
  templateUrl: './account.html',
})
export class Account {
  private readonly authService = inject(AuthService);

  protected readonly user = this.authService.currentUser;

  /** Tooltip shown on every disabled mock action. */
  protected readonly mockTitle = 'Disponible en la versión completa';

  // ---- Cambiar contraseña ----
  protected readonly oldPassword = signal('');
  protected readonly newPassword = signal('');
  protected readonly changingPassword = signal(false);
  protected readonly passwordMessage = signal<string | null>(null);
  protected readonly passwordError = signal(false);

  protected onOldPasswordInput(event: Event): void {
    this.oldPassword.set((event.target as HTMLInputElement).value);
  }

  protected onNewPasswordInput(event: Event): void {
    this.newPassword.set((event.target as HTMLInputElement).value);
  }

  protected async onChangePassword(event: Event): Promise<void> {
    event.preventDefault();
    if (this.changingPassword()) return;

    this.changingPassword.set(true);
    this.passwordMessage.set(null);
    this.passwordError.set(false);

    try {
      await this.authService.updatePassword(this.oldPassword(), this.newPassword());
      this.passwordMessage.set('Contraseña actualizada correctamente.');
      this.passwordError.set(false);
      this.oldPassword.set('');
      this.newPassword.set('');
    } catch {
      this.passwordMessage.set('No se pudo actualizar la contraseña. Verificá los datos ingresados.');
      this.passwordError.set(true);
    } finally {
      this.changingPassword.set(false);
    }
  }
}
