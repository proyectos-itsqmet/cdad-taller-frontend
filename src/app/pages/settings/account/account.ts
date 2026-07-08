import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideLock,
  lucideMonitor,
  lucideShield,
  lucideTrash2,
  lucideZap,
} from '@ng-icons/lucide';
import { DataService } from '../../../core/data/data.service';
import { formatBytes } from '../../../core/util/format';
import { StorageMeter } from '../../../shared/ui/storage-meter/storage-meter';
import { UserAvatar } from '../../../shared/ui/user-avatar/user-avatar';

/**
 * Account — "Administrar cuenta". Profile fields are pre-populated from the
 * current user but every write action (Guardar, seguridad, plan, cerrar cuenta)
 * is an inert mock, disabled with an explanatory tooltip.
 */
@Component({
  selector: 'kubo-settings-account',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, UserAvatar, StorageMeter],
  providers: [
    provideIcons({ lucideShield, lucideLock, lucideMonitor, lucideZap, lucideTrash2 }),
  ],
  host: { class: 'block' },
  templateUrl: './account.html',
})
export class Account {
  private readonly data = inject(DataService);

  protected readonly user = this.data.currentUser;
  protected readonly quota = this.data.storageQuotaBytes;

  /** Exposed to the template for byte formatting. */
  protected readonly formatBytes = formatBytes;

  /** Tooltip shown on every disabled mock action. */
  protected readonly mockTitle = 'Disponible en la versión completa';
}
