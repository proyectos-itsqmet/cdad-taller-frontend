import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideBox,
  lucideEye,
  lucideEyeOff,
  lucideLock,
  lucideMail,
  lucideUser,
} from '@ng-icons/lucide';
import { AuthBrandPanel } from '../brand-panel/brand-panel';

/** Client-side email shape check run before we call the backend. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register — public sign-up page.
 *
 * Mirrors the login split layout. All field state is signal-driven; client-side
 * validation runs first, then we call AuthService.register() against the
 * backend. On success we navigate to /login so the user can sign in.
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
    }),
  ],
  templateUrl: './register.html',
})
export class Register {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly firstName = signal('');
  protected readonly lastName = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly confirm = signal('');
  protected readonly acceptTerms = signal(false);

  protected readonly showPassword = signal(false);
  protected readonly showConfirm = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly apiError = signal<string | null>(null);

  /** Flip once the user tries to submit — reveals every pending hint at once. */
  protected readonly submitted = signal(false);
  protected readonly firstNameTouched = signal(false);
  protected readonly lastNameTouched = signal(false);
  protected readonly emailTouched = signal(false);
  protected readonly passwordTouched = signal(false);
  protected readonly confirmTouched = signal(false);

  protected readonly firstNameError = computed(() => {
    const value = this.firstName().trim();
    if (!value) return 'Ingresá tu nombre.';
    if (value.length < 2) return 'El nombre es demasiado corto.';
    return null;
  });

  protected readonly lastNameError = computed(() => {
    const value = this.lastName().trim();
    if (!value) return 'Ingresá tu apellido.';
    if (value.length < 2) return 'El apellido es demasiado corto.';
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

  protected readonly showFirstNameError = computed(
    () => (this.firstNameTouched() || this.submitted()) && this.firstNameError() !== null,
  );
  protected readonly showLastNameError = computed(
    () => (this.lastNameTouched() || this.submitted()) && this.lastNameError() !== null,
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

  protected onFirstNameInput(event: Event): void {
    this.firstName.set((event.target as HTMLInputElement).value);
  }

  protected onLastNameInput(event: Event): void {
    this.lastName.set((event.target as HTMLInputElement).value);
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
    this.apiError.set(null);
    if (
      this.firstNameError() ||
      this.lastNameError() ||
      this.emailError() ||
      this.passwordError() ||
      this.confirmError() ||
      this.termsError()
    ) {
      return;
    }
    
    this.isLoading.set(true);
    this.authService.register({
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
      email: this.email().trim(),
      password: this.password()
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        void this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.apiError.set('Ocurrió un error al registrar la cuenta. Es posible que el correo ya esté en uso.');
      }
    });
  }
}
