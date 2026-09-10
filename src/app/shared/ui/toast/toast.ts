import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/toast/toast.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheckCircle2, lucideAlertCircle, lucideInfo, lucideX } from '@ng-icons/lucide';

@Component({
  selector: 'kubo-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [provideIcons({ lucideCheckCircle2, lucideAlertCircle, lucideInfo, lucideX })],
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="pointer-events-auto flex items-center gap-3 w-80 p-4 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 animate-in slide-in-from-right-8 fade-in duration-300">
          
          @if (toast.type === 'success') {
            <ng-icon name="lucideCheckCircle2" class="text-emerald-500 text-xl" />
          } @else if (toast.type === 'error') {
            <ng-icon name="lucideAlertCircle" class="text-rose-500 text-xl" />
          } @else {
            <ng-icon name="lucideInfo" class="text-blue-500 text-xl" />
          }

          <span class="flex-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {{ toast.message }}
          </span>

          <button (click)="toastService.remove(toast.id)" class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <ng-icon name="lucideX" class="text-lg" />
          </button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);
}
