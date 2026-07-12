import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideBox,
  lucideEye,
  lucideEyeOff,
  lucideInfo,
  lucideLock,
  lucideMail,
} from '@ng-icons/lucide';
import { AuthBrandPanel } from '../brand-panel/brand-panel';

/** Illustrative email shape check — this is a mockup, not real validation. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Login — public, mock sign-in page (NO backend).
 *
 * Split layout: cyan brand panel on `lg`, form card on the right. Field state
 * lives in signals; validation is purely client-side and illustrative. On a
 * valid submit we navigate to /home for the demo flow — nothing is persisted
 * and we never claim a session was created.
 */
@Component({
  selector: 'kubo-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgIcon, AuthBrandPanel],
  providers: [
    provideIcons({
      lucideBox,
      lucideMail,
      lucideLock,
      lucideEye,
      lucideEyeOff,
      lucideArrowRight,
      lucideInfo,
    }),
  ],
  templateUrl: './login.html',
})
export class Login {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly remember = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly apiError = signal<string | null>(null);

  /** Flip once the user tries to submit — reveals every pending hint at once. */
  protected readonly submitted = signal(false);
  protected readonly emailTouched = signal(false);
  protected readonly passwordTouched = signal(false);

  protected readonly emailError = computed(() => {
    const value = this.email().trim();
    if (!value) return 'Ingresá tu correo electrónico.';
    if (!EMAIL_RE.test(value)) return 'Ingresá un correo electrónico válido.';
    return null;
  });

  protected readonly passwordError = computed(() => {
    const value = this.password();
    if (!value) return 'Ingresá tu contraseña.';
    if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    return null;
  });

  protected readonly showEmailError = computed(
    () => (this.emailTouched() || this.submitted()) && this.emailError() !== null,
  );
  protected readonly showPasswordError = computed(
    () => (this.passwordTouched() || this.submitted()) && this.passwordError() !== null,
  );

  protected onEmailInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected onPasswordInput(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }

  protected onRememberChange(event: Event): void {
    this.remember.set((event.target as HTMLInputElement).checked);
  }

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    this.apiError.set(null);
    if (this.emailError() || this.passwordError()) {
      return;
    }

    this.isLoading.set(true);
    this.authService
      .login({
        email: this.email().trim(),
        password: this.password(),
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          void this.router.navigate(['/home']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.apiError.set('Credenciales incorrectas o error en el servidor.');
        },
      });
  }
}
