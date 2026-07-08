import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBox, lucideGlobe, lucideMail, lucideShare2 } from '@ng-icons/lucide';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

interface AnchorLink {
  label: string;
  fragment: string;
}

interface RouteLink {
  label: string;
  link: string;
}

interface Social {
  icon: string;
  label: string;
}

/**
 * kubo-public-footer — multi-column marketing footer.
 *
 * Producto (section anchors), Soporte (real routed pages: contacto,
 * centro-de-ayuda, sobre-nosotros) and Legal (inert placeholder links, since
 * this is a read-only mockup). Bottom bar carries the brand lockup, copyright,
 * aria-labelled social buttons and a theme toggle. Stacks fully on mobile.
 */
@Component({
  selector: 'kubo-public-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgIcon, ThemeToggle],
  providers: [provideIcons({ lucideBox, lucideGlobe, lucideMail, lucideShare2 })],
  host: { class: 'block' },
  templateUrl: './public-footer.html',
})
export class PublicFooter {
  protected readonly productLinks: readonly AnchorLink[] = [
    { label: 'Características', fragment: 'producto' },
    { label: 'Precios', fragment: 'precios' },
    { label: 'Seguridad', fragment: 'seguridad' },
  ];

  protected readonly supportLinks: readonly RouteLink[] = [
    { label: 'Contacto', link: '/contacto' },
    { label: 'Centro de ayuda', link: '/centro-de-ayuda' },
    { label: 'Sobre nosotros', link: '/sobre-nosotros' },
  ];

  protected readonly legalLinks: readonly string[] = ['Términos', 'Privacidad'];

  protected readonly socials: readonly Social[] = [
    { icon: 'lucideGlobe', label: 'Sitio web' },
    { icon: 'lucideMail', label: 'Correo' },
    { icon: 'lucideShare2', label: 'Compartir' },
  ];
}
