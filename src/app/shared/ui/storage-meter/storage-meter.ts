import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHardDrive } from '@ng-icons/lucide';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { formatBytes } from '../../../core/util/format';
import { FileService } from '../../../core/files/file.service';

/**
 * kubo-storage-meter — calm storage usage indicator.
 * Bar turns amber above 80% and red above 95%.
 */
@Component({
  selector: 'kubo-storage-meter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [provideIcons({ lucideHardDrive })],
  host: { class: 'block' },
  template: `
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <ng-icon name="lucideHardDrive" class="text-sm" aria-hidden="true" />
        <span>Almacenamiento</span>
      </div>
      <div
        class="h-2 w-full overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        [attr.aria-valuenow]="percentRounded()"
        [attr.aria-label]="label()"
      >
        <div
          class="h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
          [class]="barClass()"
          [style.width.%]="percent()"
        ></div>
      </div>
      <p class="text-xs text-muted-foreground">{{ label() }}</p>
    </div>
  `,
})
export class StorageMeter {
  private readonly fileService = inject(FileService);
  private readonly maxBytes = 15 * 1024 * 1024 * 1024; // 15 GB

  protected readonly statsQuery = injectQuery(() => ({
    queryKey: ['stats'],
    queryFn: () => lastValueFrom(this.fileService.getStats())
  }));

  protected readonly percent = computed(() => {
    const used = this.statsQuery.data()?.usedBytes || 0;
    return Math.min(100, (used / this.maxBytes) * 100);
  });

  protected readonly percentRounded = computed(() => Math.round(this.percent()));

  protected readonly barClass = computed(() => {
    const p = this.percent();
    if (p > 95) return 'bg-destructive';
    if (p > 80) return 'bg-warning';
    return 'bg-brand';
  });

  protected readonly label = computed(() => {
    const used = this.statsQuery.data()?.usedBytes || 0;
    return `${formatBytes(used)} de ${formatBytes(this.maxBytes)} usados`;
  });
}
