import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideCheckCheck,
  lucideClock,
  lucideMail,
  lucideMapPin,
  lucideMessageCircle,
  lucidePhone,
  lucideSend,
} from '@ng-icons/lucide';

import { PublicNav } from '../../shared/ui/public-nav/public-nav';
import { PublicFooter } from '../../shared/ui/public-footer/public-footer';
import { Reveal } from '../../shared/directives/reveal';

/** A single "how to reach us" row shown in the side panel. */
interface ContactChannel {
  icon: string;
  label: string;
  value: string;
  detail: string;
}

/**
 * Contacto — full public page (nav + hero + illustrative form + info panel).
 *
 * READ-ONLY mockup: the form does NOT submit to any backend. On submit we only
 * flip a client-side signal to show an inline confirmation that explicitly
 * states it is a demo and no data was sent.
 */
@Component({
  selector: 'kubo-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgIcon, PublicNav, PublicFooter, Reveal],
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideCheckCheck,
      lucideClock,
      lucideMail,
      lucideMapPin,
      lucideMessageCircle,
      lucidePhone,
      lucideSend,
    }),
  ],
  host: { class: 'block' },
  templateUrl: './contact.html',
})
export class Contact {
  /** True once the illustrative form has been "sent" (demo only). */
  protected readonly submitted = signal(false);

  protected readonly channels: readonly ContactChannel[] = [
    {
      icon: 'lucideMail',
      label: 'Correo',
      value: 'hola@kubodrive.com',
      detail: 'Respondemos en menos de 24 horas hábiles.',
    },
    {
      icon: 'lucidePhone',
      label: 'Teléfono',
      value: '+593 4 000 0000',
      detail: 'Lunes a viernes, de 9:00 a 18:00.',
    },
    {
      icon: 'lucideMapPin',
      label: 'Dirección',
      value: 'Av. Francisco de Orellana, Guayaquil',
      detail: 'Ecuador · Edificio The Point, piso 12.',
    },
  ];

  /**
   * Illustrative submit. Prevents the native navigation/reload and shows the
   * confirmation state. Nothing is persisted or transmitted.
   */
  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
  }

  /** Return to the empty form so the demo can be replayed. */
  protected resetForm(): void {
    this.submitted.set(false);
  }
}
