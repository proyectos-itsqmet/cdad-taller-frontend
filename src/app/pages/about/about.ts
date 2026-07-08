import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideCloud,
  lucideGauge,
  lucideGlobe,
  lucideHeart,
  lucideLock,
  lucideMail,
  lucideShield,
  lucideStar,
  lucideTarget,
  lucideTrendingUp,
  lucideUsers,
  lucideZap,
} from '@ng-icons/lucide';

import { DataService } from '../../core/data/data.service';
import { User } from '../../core/models/models';
import { PublicNav } from '../../shared/ui/public-nav/public-nav';
import { PublicFooter } from '../../shared/ui/public-footer/public-footer';
import { UserAvatar } from '../../shared/ui/user-avatar/user-avatar';
import { Reveal } from '../../shared/directives/reveal';

/** One principle in the values grid. */
interface Value {
  icon: string;
  title: string;
  description: string;
}

/** A headline metric in the stats band. */
interface Stat {
  icon: string;
  value: string;
  label: string;
}

/** A team member = a real DataService user + a display role. */
interface TeamMember {
  user: User;
  role: string;
}

/** Roles assigned to the mock users, in the order they appear in the data. */
const ROLES: readonly string[] = [
  'Fundador y CEO',
  'Directora de Producto',
  'Líder de Ingeniería',
  'Diseño y Experiencia',
];

/**
 * Sobre nosotros — full public page. Mission/story, a values grid, a team
 * section built from real DataService users, a stats band and a closing CTA.
 */
@Component({
  selector: 'kubo-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgIcon, PublicNav, PublicFooter, UserAvatar, Reveal],
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideCloud,
      lucideGauge,
      lucideGlobe,
      lucideHeart,
      lucideLock,
      lucideMail,
      lucideShield,
      lucideStar,
      lucideTarget,
      lucideTrendingUp,
      lucideUsers,
      lucideZap,
    }),
  ],
  host: { class: 'block' },
  templateUrl: './about.html',
})
export class About {
  private readonly data = inject(DataService);

  /** Team members derived from the mock users, each paired with a role. */
  protected readonly team = computed<TeamMember[]>(() =>
    this.data.users().map((user, index) => ({
      user,
      role: ROLES[index] ?? 'Equipo KuboDrive',
    })),
  );

  protected readonly values: readonly Value[] = [
    {
      icon: 'lucideShield',
      title: 'Seguridad primero',
      description: 'Tus archivos se guardan con cifrado y controles de acceso claros. Tú decides quién ve qué.',
    },
    {
      icon: 'lucideZap',
      title: 'Simplicidad',
      description: 'Una interfaz limpia y directa: guardar, organizar y compartir sin fricción ni curvas de aprendizaje.',
    },
    {
      icon: 'lucideLock',
      title: 'Privacidad',
      description: 'Tus datos son tuyos. No los vendemos ni los usamos para nada que no hayas autorizado.',
    },
    {
      icon: 'lucideCloud',
      title: 'En todas partes',
      description: 'Accede a tu unidad desde cualquier dispositivo, con la misma experiencia rápida y fluida.',
    },
    {
      icon: 'lucideGauge',
      title: 'Rendimiento',
      description: 'Construido para ser veloz: cargas rápidas, navegación instantánea y cero esperas innecesarias.',
    },
    {
      icon: 'lucideHeart',
      title: 'Hecho con cariño',
      description: 'Cuidamos cada detalle porque nos importa que tu experiencia sea realmente buena.',
    },
  ];

  protected readonly stats: readonly Stat[] = [
    { icon: 'lucideUsers', value: '25 000+', label: 'Usuarios en el mundo' },
    { icon: 'lucideStar', value: '4,8/5', label: 'Valoración promedio' },
    { icon: 'lucideTrendingUp', value: '99,9 %', label: 'Tiempo de actividad' },
    { icon: 'lucideGlobe', value: '30+', label: 'Países' },
  ];
}
