import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBox, lucideCloud, lucideShield, lucideZap } from '@ng-icons/lucide';

interface Feature {
  icon: string;
  title: string;
  text: string;
}

/**
 * kubo-auth-brand-panel — decorative left panel for the split auth layout.
 *
 * Static cyan gradient with the KuboDrive lockup (links home), a contextual
 * headline/subtext (overridable per page) and a short feature list. Purely
 * presentational: no browser APIs, safe to prerender. Hidden below `lg` by the
 * consumer; the form column carries a compact lockup on mobile.
 */
@Component({
  selector: 'kubo-auth-brand-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgIcon],
  providers: [provideIcons({ lucideBox, lucideShield, lucideZap, lucideCloud })],
  templateUrl: './brand-panel.html',
})
export class AuthBrandPanel {
  /** Large headline shown in the panel body. */
  readonly headline = input('Tu nube, ordenada y siempre a mano.');
  /** Supporting line under the headline. */
  readonly subtext = input(
    'Guardá, organizá y compartí tus archivos con la tranquilidad de tenerlo todo en un solo lugar.',
  );

  protected readonly features: readonly Feature[] = [
    {
      icon: 'lucideShield',
      title: 'Cifrado de extremo a extremo',
      text: 'Tus archivos viajan y se guardan protegidos.',
    },
    {
      icon: 'lucideZap',
      title: 'Sincronización instantánea',
      text: 'Cambios reflejados en todos tus dispositivos.',
    },
    {
      icon: 'lucideCloud',
      title: '15 GB para empezar',
      text: 'Espacio gratuito, ampliable cuando lo necesites.',
    },
  ];
}
