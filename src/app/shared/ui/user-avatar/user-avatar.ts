import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { User } from '../../../core/models/models';

/**
 * kubo-user-avatar — circular initials badge on the user's brand color.
 */
@Component({
  selector: 'kubo-user-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `
    <span
      class="inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold leading-none text-white"
      role="img"
      [attr.aria-label]="user().name"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.font-size.px]="fontSize()"
      [style.background-color]="user().avatarColor"
    >
      {{ initials() }}
    </span>
  `,
})
export class UserAvatar {
  /** User whose initials and color are shown. */
  readonly user = input.required<User>();
  /** Diameter in pixels. */
  readonly size = input<number>(40);

  protected readonly fontSize = computed(() => Math.round(this.size() * 0.4));

  protected readonly initials = computed(() => {
    const parts = this.user().name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    const first = parts[0][0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
    return (first + last).toUpperCase();
  });
}
