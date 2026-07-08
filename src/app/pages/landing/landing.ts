import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideCheck,
  lucideChevronDown,
  lucideCloud,
  lucideFolder,
  lucideFolderOpen,
  lucideHardDrive,
  lucideLock,
  lucideMonitor,
  lucideSearch,
  lucideShare2,
  lucideShield,
  lucideStar,
  lucideUpload,
  lucideUsers,
  lucideZap,
} from '@ng-icons/lucide';

import { DataService } from '../../core/data/data.service';
import { User } from '../../core/models/models';
import { formatBytes } from '../../core/util/format';

import { Reveal } from '../../shared/directives/reveal';
import { PublicNav } from '../../shared/ui/public-nav/public-nav';
import { PublicFooter } from '../../shared/ui/public-footer/public-footer';
import { FileIcon } from '../../shared/ui/file-icon/file-icon';
import { UserAvatar } from '../../shared/ui/user-avatar/user-avatar';

interface Feature {
  icon: string;
  title: string;
  text: string;
}

interface Step {
  icon: string;
  title: string;
  text: string;
}

interface SecurityPoint {
  icon: string;
  title: string;
  text: string;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  storage: string;
  tagline: string;
  features: readonly string[];
  cta: string;
  popular: boolean;
}

interface Faq {
  q: string;
  a: string;
}

interface Testimonial {
  user: User;
  role: string;
  quote: string;
}

/**
 * Landing — the public marketing home ("/"). Full standalone page (no AppShell):
 * sticky public nav + hero with an interactive, parallax-tilting product mock,
 * trust bar, features, how-it-works, security, pricing, testimonials, an
 * accordion FAQ and a closing CTA band, wrapped by the shared public footer.
 *
 * SSR/prerender + zoneless safe: the only browser touch is a pointer-driven
 * tilt on the hero mock, guarded behind `isPlatformBrowser` and a
 * reduced-motion check resolved in `afterNextRender`.
 */
@Component({
  selector: 'kubo-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    NgIcon,
    Reveal,
    PublicNav,
    PublicFooter,
    FileIcon,
    UserAvatar,
  ],
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideCheck,
      lucideChevronDown,
      lucideCloud,
      lucideFolder,
      lucideFolderOpen,
      lucideHardDrive,
      lucideLock,
      lucideMonitor,
      lucideSearch,
      lucideShare2,
      lucideShield,
      lucideStar,
      lucideUpload,
      lucideUsers,
      lucideZap,
    }),
  ],
  templateUrl: './landing.html',
  styles: [
    `
      /* Ambient float for the background blobs and floating storage card.
         The global reduced-motion rule (styles.css) neutralizes these by
         forcing animation-duration to ~0, so no extra guard is needed here. */
      @keyframes kubo-blob {
        0%,
        100% {
          transform: translate3d(0, 0, 0) scale(1);
        }
        50% {
          transform: translate3d(1.5rem, -1.25rem, 0) scale(1.08);
        }
      }
      @keyframes kubo-blob-alt {
        0%,
        100% {
          transform: translate3d(0, 0, 0) scale(1.05);
        }
        50% {
          transform: translate3d(-1.25rem, 1rem, 0) scale(0.95);
        }
      }
      @keyframes kubo-bob {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-0.5rem);
        }
      }
      :host .blob-a {
        animation: kubo-blob 11s ease-in-out infinite;
      }
      :host .blob-b {
        animation: kubo-blob-alt 13s ease-in-out infinite;
      }
      :host .bob {
        animation: kubo-bob 6s ease-in-out infinite;
      }
    `,
  ],
})
export class Landing {
  private readonly data = inject(DataService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Exposed to the template for byte formatting (never render raw sizes). */
  protected readonly formatBytes = formatBytes;

  // --- Hero product mock (real read-only data) ---------------------------
  protected readonly mockFiles = computed(() => this.data.recentFiles(6));
  protected readonly mockFolders = computed(() =>
    this.data.childFolders(null).slice(0, 3),
  );
  protected readonly storageUsed = this.data.storageUsedBytes;
  protected readonly storageQuota = this.data.storageQuotaBytes;
  protected readonly storagePct = computed(() => {
    const quota = this.storageQuota();
    if (quota <= 0) return 0;
    return Math.min(100, Math.round((this.storageUsed() / quota) * 100));
  });

  // --- Interactive tilt on the hero mock ---------------------------------
  /** Whether motion effects are allowed (respects prefers-reduced-motion). */
  private readonly motionOk = signal(false);
  private readonly tilt = signal<{ rx: number; ry: number }>({ rx: 0, ry: 0 });

  /** CSS transform applied to the mock card; neutral when motion is off. */
  protected readonly mockTransform = computed(() => {
    const { rx, ry } = this.tilt();
    return `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });

  constructor() {
    afterNextRender(() => {
      const reduce =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.motionOk.set(!reduce);
    });
  }

  protected onMockMove(event: PointerEvent): void {
    if (!this.isBrowser || !this.motionOk()) return;
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const px = (event.clientX - rect.left) / rect.width; // 0..1
    const py = (event.clientY - rect.top) / rect.height; // 0..1
    const max = 6; // degrees
    this.tilt.set({ rx: (0.5 - py) * max, ry: (px - 0.5) * max });
  }

  protected onMockLeave(): void {
    this.tilt.set({ rx: 0, ry: 0 });
  }

  // --- FAQ accordion ------------------------------------------------------
  protected readonly openFaq = signal<number>(0);

  protected toggleFaq(index: number): void {
    this.openFaq.update((current) => (current === index ? -1 : index));
  }

  // --- Static content -----------------------------------------------------
  protected readonly features: readonly Feature[] = [
    {
      icon: 'lucideShield',
      title: 'Almacenamiento seguro',
      text: 'Tus archivos viajan y descansan cifrados, con copias automáticas para que nunca pierdas nada.',
    },
    {
      icon: 'lucideShare2',
      title: 'Compartir con permisos',
      text: 'Enviá enlaces y decidí quién puede ver o editar cada archivo, sin exponer tu unidad completa.',
    },
    {
      icon: 'lucideFolderOpen',
      title: 'Carpetas anidadas',
      text: 'Organizá todo en carpetas dentro de carpetas y encontrá el orden que se adapta a tu equipo.',
    },
    {
      icon: 'lucideMonitor',
      title: 'Acceso multiplataforma',
      text: 'Entrá desde el navegador en cualquier dispositivo: tu unidad siempre está sincronizada.',
    },
    {
      icon: 'lucideSearch',
      title: 'Búsqueda rápida',
      text: 'Escribí una palabra y encontrá el archivo al instante, sin importar cuánto hayas guardado.',
    },
    {
      icon: 'lucideZap',
      title: 'Actividad y control',
      text: 'Seguí cada cambio, subida y compartición con un registro de actividad claro y ordenado.',
    },
  ];

  protected readonly steps: readonly Step[] = [
    {
      icon: 'lucideUpload',
      title: 'Subí tus archivos',
      text: 'Arrastrá documentos, fotos o proyectos y quedan disponibles al instante en tu unidad.',
    },
    {
      icon: 'lucideFolderOpen',
      title: 'Organizá en carpetas',
      text: 'Creá carpetas anidadas, marcá destacados y mantené cada proyecto en su lugar.',
    },
    {
      icon: 'lucideShare2',
      title: 'Compartí al instante',
      text: 'Generá un enlace con permisos de ver o editar y colaborá con tu equipo en segundos.',
    },
  ];

  protected readonly securityPoints: readonly SecurityPoint[] = [
    {
      icon: 'lucideLock',
      title: 'Cifrado de extremo a extremo',
      text: 'Cada archivo se cifra en tránsito y en reposo. Solo vos y quienes autorices acceden al contenido.',
    },
    {
      icon: 'lucideUsers',
      title: 'Permisos granulares',
      text: 'Definí el acceso por persona con dos niveles claros: "Puede ver" o "Puede editar".',
    },
    {
      icon: 'lucideShield',
      title: 'Control de acceso',
      text: 'Revisá quién tiene acceso, revocá enlaces y mantené el control total de tu información.',
    },
  ];

  protected readonly securityBadges: readonly string[] = [
    'Cifrado AES-256',
    'Copias automáticas',
    'Registro de actividad',
    '99,9 % de disponibilidad',
  ];

  protected readonly trustLogos: readonly string[] = [
    'Profermaco',
    'ITSQMET',
    'Nube Andina',
    'DataCoop',
    'TechLat',
  ];

  protected readonly plans: readonly Plan[] = [
    {
      name: 'Free',
      price: '$0',
      period: 'para siempre',
      storage: '2 GB',
      tagline: 'Ideal para empezar a organizar lo tuyo.',
      features: [
        '2 GB de almacenamiento',
        'Compartir con enlaces',
        'Acceso multiplataforma',
        'Soporte por correo',
      ],
      cta: 'Comenzar gratis',
      popular: false,
    },
    {
      name: 'Personal',
      price: '$4',
      period: 'por mes',
      storage: '200 GB',
      tagline: 'Para quienes viven en la nube todos los días.',
      features: [
        '200 GB de almacenamiento',
        'Permisos avanzados (ver / editar)',
        'Carpetas ilimitadas',
        'Historial de actividad',
        'Soporte prioritario',
      ],
      cta: 'Elegir Personal',
      popular: true,
    },
    {
      name: 'Equipos',
      price: '$12',
      period: 'por mes',
      storage: '2 TB',
      tagline: 'Colaboración sin límites para tu organización.',
      features: [
        '2 TB compartidos',
        'Miembros ilimitados',
        'Control de acceso granular',
        'Panel de actividad del equipo',
        'Soporte 24/7',
      ],
      cta: 'Elegir Equipos',
      popular: false,
    },
  ];

  protected readonly faqs: readonly Faq[] = [
    {
      q: '¿Cuánto almacenamiento gratuito tengo?',
      a: 'El plan Free incluye 2 GB de almacenamiento sin costo y sin fecha de vencimiento. Podés ampliarlo cuando quieras pasando a Personal o Equipos.',
    },
    {
      q: '¿Cómo comparto archivos con otras personas?',
      a: 'Generás un enlace desde cualquier archivo y elegís el permiso: "Puede ver" para consulta o "Puede editar" para colaborar. Podés revocar el acceso en cualquier momento.',
    },
    {
      q: '¿Están seguros mis archivos?',
      a: 'Sí. Todo se cifra en tránsito y en reposo, con copias automáticas. Vos controlás quién accede a cada archivo y podés revisar la actividad en detalle.',
    },
    {
      q: '¿Puedo cambiar de plan cuando quiera?',
      a: 'Claro. Subís o bajás de plan cuando lo necesites y el espacio se ajusta al instante, sin perder ningún archivo.',
    },
    {
      q: '¿Necesito una tarjeta para empezar?',
      a: 'No. Creás tu cuenta y empezás con el plan Free sin ingresar datos de pago. Solo los sumás si decidís ampliar tu espacio.',
    },
  ];

  protected readonly testimonials = computed<Testimonial[]>(() => {
    const roles: Record<string, { role: string; quote: string }> = {
      u2: {
        role: 'Diseñadora de producto',
        quote:
          'Paso el día compartiendo mockups y con KuboDrive controlo exactamente quién ve y quién edita. Se acabó el caos de versiones.',
      },
      u3: {
        role: 'Desarrollador full-stack',
        quote:
          'Las carpetas anidadas y la búsqueda son rapidísimas. Encuentro cualquier archivo del proyecto en segundos, desde cualquier equipo.',
      },
      u4: {
        role: 'Gerente de operaciones',
        quote:
          'El registro de actividad me da tranquilidad total: sé qué se movió, quién lo compartió y cuándo. Control real sobre la información.',
      },
    };
    return Object.entries(roles)
      .map(([id, meta]) => {
        const user = this.data.userById(id);
        return user ? { user, role: meta.role, quote: meta.quote } : null;
      })
      .filter((t): t is Testimonial => t !== null);
  });
}
