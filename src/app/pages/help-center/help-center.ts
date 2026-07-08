import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideBookOpen,
  lucideChevronDown,
  lucideHardDrive,
  lucideLifeBuoy,
  lucideMessageCircle,
  lucideRocket,
  lucideSearch,
  lucideShare2,
  lucideShield,
} from '@ng-icons/lucide';

import { PublicNav } from '../../shared/ui/public-nav/public-nav';
import { PublicFooter } from '../../shared/ui/public-footer/public-footer';
import { Reveal } from '../../shared/directives/reveal';

/** A help category card. */
interface HelpCategory {
  icon: string;
  title: string;
  description: string;
  articles: number;
}

/** A single frequently-asked question. */
interface Faq {
  question: string;
  answer: string;
}

/**
 * Centro de ayuda — full public page.
 *
 * Hero with an inert search field (READ-ONLY mockup: it does not query
 * anything), a grid of help categories, and an accessible accordion of common
 * questions driven by a single open-index signal.
 */
@Component({
  selector: 'kubo-help-center',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgIcon, PublicNav, PublicFooter, Reveal],
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideBookOpen,
      lucideChevronDown,
      lucideHardDrive,
      lucideLifeBuoy,
      lucideMessageCircle,
      lucideRocket,
      lucideSearch,
      lucideShare2,
      lucideShield,
    }),
  ],
  host: { class: 'block' },
  templateUrl: './help-center.html',
})
export class HelpCenter {
  /** Index of the currently expanded FAQ item; null when all are collapsed. */
  protected readonly openFaq = signal<number | null>(0);

  protected readonly categories: readonly HelpCategory[] = [
    {
      icon: 'lucideRocket',
      title: 'Primeros pasos',
      description: 'Crea tu cuenta, sube tus primeros archivos y organiza tu unidad en minutos.',
      articles: 8,
    },
    {
      icon: 'lucideShare2',
      title: 'Compartir archivos',
      description: 'Comparte con permisos de ver o editar y controla quién accede a cada archivo.',
      articles: 6,
    },
    {
      icon: 'lucideShield',
      title: 'Cuenta y seguridad',
      description: 'Protege tu cuenta, gestiona tus sesiones y decide cómo cuidamos tu privacidad.',
      articles: 7,
    },
    {
      icon: 'lucideHardDrive',
      title: 'Almacenamiento',
      description: 'Consulta tu espacio disponible, amplía tu plan y libera almacenamiento fácilmente.',
      articles: 5,
    },
  ];

  protected readonly faqs: readonly Faq[] = [
    {
      question: '¿Cómo subo archivos a KuboDrive?',
      answer:
        'Entra a "Mi unidad", abre la carpeta donde quieres guardarlos y usa el botón "Subir". ' +
        'También puedes arrastrar los archivos directamente sobre la lista.',
    },
    {
      question: '¿Cómo comparto un archivo con otra persona?',
      answer:
        'Abre el menú de un archivo y elige "Compartir". Escribe el correo de la persona, define ' +
        'su nivel de acceso y listo: aparecerá en la lista de personas con acceso.',
    },
    {
      question: '¿Qué diferencia hay entre "Puede ver" y "Puede editar"?',
      answer:
        '"Puede ver" permite abrir y descargar el archivo sin modificarlo. "Puede editar" además ' +
        'permite cambiar su contenido y reemplazarlo. Puedes cambiar el permiso cuando quieras.',
    },
    {
      question: '¿Cuánto espacio de almacenamiento tengo?',
      answer:
        'Cada cuenta incluye un espacio inicial que puedes ver en cualquier momento desde el ' +
        'medidor de almacenamiento en la barra lateral. Al acercarte al límite te avisaremos.',
    },
    {
      question: '¿Puedo cambiar entre tema claro y oscuro?',
      answer:
        'Sí. Usa el conmutador de tema disponible en la barra superior o en Configuración → Tema. ' +
        'Puedes elegir claro, oscuro o seguir automáticamente la preferencia de tu sistema.',
    },
    {
      question: '¿Puedo recuperar un archivo que eliminé?',
      answer:
        'En la versión completa, los archivos eliminados pasan a la papelera durante un periodo ' +
        'antes de borrarse de forma definitiva, para que puedas restaurarlos si te hicieron falta.',
    },
  ];

  /** Toggle a FAQ item open/closed. */
  protected toggleFaq(index: number): void {
    this.openFaq.update((current) => (current === index ? null : index));
  }
}
