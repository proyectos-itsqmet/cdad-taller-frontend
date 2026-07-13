import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideClock, lucideFolderOpen, lucideSearch, lucideFilter, lucideChevronLeft, lucideChevronRight, lucideFile, lucideFolder, lucideHistory } from '@ng-icons/lucide';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

import { FileService } from '../../core/files/file.service';
import { relativeTime } from '../../core/util/format';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'kubo-recent',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NgIcon, EmptyState],
  providers: [provideIcons({ lucideClock, lucideFolderOpen, lucideSearch, lucideFilter, lucideChevronLeft, lucideChevronRight, lucideFile, lucideFolder, lucideHistory })],
  templateUrl: './recent.html',
})
export class Recent {
  private readonly fileService = inject(FileService);

  readonly actionType = signal('');
  readonly itemName = signal('');
  readonly startDate = signal('');
  readonly endDate = signal('');
  readonly page = signal(0);

  protected readonly historyQuery = injectQuery(() => ({
    queryKey: ['history', this.actionType(), this.itemName(), this.startDate(), this.endDate(), this.page()],
    queryFn: () => lastValueFrom(this.fileService.getHistory({
      actionType: this.actionType() || undefined,
      itemName: this.itemName() || undefined,
      startDate: this.startDate() ? new Date(this.startDate()).toISOString() : undefined,
      endDate: this.endDate() ? new Date(this.endDate()).toISOString() : undefined,
      page: this.page(),
      size: 10
    }))
  }));

  protected readonly relativeTime = relativeTime;

  protected onFilterChange() {
    this.page.set(0); // Reset page on filter change
  }

  protected nextPage() {
    if (!this.historyQuery.data()?.last) {
      this.page.update(p => p + 1);
    }
  }

  protected prevPage() {
    if (!this.historyQuery.data()?.first) {
      this.page.update(p => Math.max(0, p - 1));
    }
  }
}
