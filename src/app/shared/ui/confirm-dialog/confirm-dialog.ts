import { ChangeDetectionStrategy, Component, model, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideAlertTriangle, lucideX, lucideLoader2 } from '@ng-icons/lucide';

@Component({
  selector: 'kubo-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [provideIcons({ lucideAlertTriangle, lucideX, lucideLoader2 })],
  templateUrl: './confirm-dialog.html'
})
export class ConfirmDialog {
  readonly open = model(false);
  readonly title = input<string>('Confirmar acción');
  readonly message = input<string>('¿Estás seguro?');
  readonly confirmText = input<string>('Confirmar');
  readonly cancelText = input<string>('Cancelar');
  readonly loading = input<boolean>(false);
  
  readonly confirm = output<void>();

  protected close(): void {
    this.open.set(false);
  }

  protected submit(): void {
    if (this.loading()) return;
    this.confirm.emit();
  }
}
