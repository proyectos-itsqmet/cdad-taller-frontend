import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMonitor, lucideMoon, lucideSun } from '@ng-icons/lucide';
import { ThemeMode } from '../../../core/models/models';
import { ThemeService } from '../../../core/theme/theme.service';

interface Option {
  mode: ThemeMode;
  icon: string;
  label: string;
}

/**
 * kubo-theme-toggle — segmented Claro / Oscuro / Sistema selector.
 */
@Component({
  selector: 'kubo-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [provideIcons({ lucideSun, lucideMoon, lucideMonitor })],
  host: { class: 'inline-flex' },
  template: `
    <div class="inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface p-1" role="group" aria-label="Tema">
      @for (opt of options; track opt.mode) {
        <button
          type="button"
          class="flex size-9 items-center justify-center rounded-md text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          [class]="btnClass(theme.mode() === opt.mode)"
          [attr.aria-pressed]="theme.mode() === opt.mode"
          [attr.aria-label]="opt.label"
          [title]="opt.label"
          (click)="theme.setMode(opt.mode)"
        >
          <ng-icon [name]="opt.icon" aria-hidden="true" />
        </button>
      }
    </div>
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);

  protected readonly options: readonly Option[] = [
    { mode: 'light', icon: 'lucideSun', label: 'Claro' },
    { mode: 'dark', icon: 'lucideMoon', label: 'Oscuro' },
    { mode: 'system', icon: 'lucideMonitor', label: 'Sistema' },
  ];

  protected btnClass(active: boolean): string {
    return active
      ? 'bg-brand text-brand-fg'
      : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground';
  }
}
