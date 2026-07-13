import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheckCircle2, lucideChevronDown, lucideChevronUp, lucideFile, lucideX, lucideAlertCircle } from '@ng-icons/lucide';
import { TransferService } from '../../../core/services/transfer.service';

@Component({
  selector: 'kubo-transfer-manager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [
    provideIcons({ lucideX, lucideChevronUp, lucideChevronDown, lucideFile, lucideCheckCircle2, lucideAlertCircle })
  ],
  templateUrl: './transfer-manager.html'
})
export class TransferManager {
  protected readonly transferService = inject(TransferService);
  protected readonly transfers = this.transferService.transfers;
  protected readonly activeCount = this.transferService.activeCount;
  protected readonly isPanelOpen = this.transferService.isPanelOpen;

  protected togglePanel(): void {
    this.transferService.togglePanel();
  }

  protected clearCompleted(): void {
    this.transferService.clearCompleted();
  }
}
