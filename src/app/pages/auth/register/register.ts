import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideBox,
  lucideEye,
  lucideEyeOff,
  lucideInfo,
  lucideLock,
  lucideMail,
  lucideUser,
} from '@ng-icons/lucide';
import { AuthBrandPanel } from '../brand-panel/brand-panel';

/** Illustrative email shape check — this is a mockup, not real validation. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register — public, mock sign-up page (NO backend).
 *
 * Mirrors the login split layout. All field state is signal-driven and the
 * validation is client-side and illustrative only. A valid submit navigates to
 * /home for the demo flow; no account is created and nothing is persisted.
 */
@Component({
  selector: 'kubo-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgIcon, AuthBrandPanel],
  providers: [
    provideIcons({
      lucideBox,
      lucideUser,
      lucideMail,
      lucideLock,
      lucideEye,
      lucideEyeOff,
      lucideArrowRight,
      lucideInfo,
    }),
  ],
  templateUrl: './register.html',
})
export class Register {
  private readonly router = inject(Router);

  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly confirm = signal('');
  protected readonly acceptTerms = signal(false);

  protected readonly showPassword = signal(false);
  protected readonly showConfirm = signal(false);

  /** Flip once the user tries to submit — reveals every pending hint at once. */
  protected readonly submitted = signal(false);
  protected readonly nameTouched = signal(false);
  protected readonly emailTouched = signal(false);
  protected readonly passwordTouched = signal(false);
  protected readonly confirmTouched = signal(false);

  protected readonly nameError = computed(() => {
    const value = this.name().trim();
    if (!value) return 'Ingresá tu nombre.';
    if (value.length < 2) return 'El nombre es demasiado corto.';
    return null;
  });

  protected readonly emailError = computed(() => {
    const value = this.email().trim();
    if (!value) return 'Ingresá tu correo electrónico.';
    if (!EMAIL_RE.test(value)) return 'Ingresá un correo electrónico válido.';
    return null;
  });

  protected readonly passwordError = computed(() => {
    const value = this.password();
    if (!value) return 'Creá una contraseña.';
    if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    return null;
  });

  protected readonly confirmError = computed(() => {
    const value = this.confirm();
    if (!value) return 'Repetí la contraseña.';
    if (value !== this.password()) return 'Las contraseñas no coinciden.';
    return null;
  });

  protected readonly termsError = computed(() =>
    this.acceptTerms() ? null : 'Debés aceptar los términos para continuar.',
  );

  protected readonly showNameError = computed(
    () => (this.nameTouched() || this.submitted()) && this.nameError() !== null,
  );
  protected readonly showEmailError = computed(
    () => (this.emailTouched() || this.submitted()) && this.emailError() !== null,
  );
  protected readonly showPasswordError = computed(
    () => (this.passwordTouched() || this.submitted()) && this.passwordError() !== null,
  );
  protected readonly showConfirmError = computed(
    () => (this.confirmTouched() || this.submitted()) && this.confirmError() !== null,
  );
  protected readonly showTermsError = computed(
    () => this.submitted() && this.termsError() !== null,
  );

  protected onNameInput(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }

  protected onEmailInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected onPasswordInput(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }

  protected onConfirmInput(event: Event): void {
    this.confirm.set((event.target as HTMLInputElement).value);
  }

  protected onTermsChange(event: Event): void {
    this.acceptTerms.set((event.target as HTMLInputElement).checked);
  }

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  protected toggleConfirm(): void {
    this.showConfirm.update((v) => !v);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    if (
      this.nameError() ||
      this.emailError() ||
      this.passwordError() ||
      this.confirmError() ||
      this.termsError()
    ) {
      return;
    }
    // Demo flow only — no account is created.
    void this.router.navigate(['/home']);
  }
}
