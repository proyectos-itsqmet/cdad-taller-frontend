/**
 * Pure formatting helpers for KuboDrive. No Angular, no side effects — safe to
 * call from templates, services, and SSR alike.
 */

/** Human-readable file-kind buckets used to pick icons/colors. */
export type FileKind =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'doc'
  | 'sheet'
  | 'slide'
  | 'archive'
  | 'code'
  | 'text'
  | 'folder'
  | 'other';

/**
 * Format a byte count as a human string using binary units (base 1024).
 * Bytes render with no decimals; larger units use 1 decimal, trimming a
 * trailing ".0" so exact values read cleanly.
 *
 * @example formatBytes(1468006) // "1.4 MB"
 * @example formatBytes(839680)  // "820 KB"
 * @example formatBytes(500)     // "500 B"
 */
export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0 B';
  if (n < 1024) return `${Math.round(n)} B`;

  const units = ['KB', 'MB', 'GB', 'TB', 'PB'] as const;
  let value = n / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  const formatted = value.toFixed(1).replace(/\.0$/, '');
  return `${formatted} ${units[i]}`;
}

/** Exact mime -> Spanish label lookup for the common types. */
const MIME_LABELS: Record<string, string> = {
  'image/png': 'Imagen PNG',
  'image/jpeg': 'Imagen JPEG',
  'image/jpg': 'Imagen JPEG',
  'image/gif': 'Imagen GIF',
  'image/webp': 'Imagen WebP',
  'image/svg+xml': 'Imagen SVG',
  'image/heic': 'Imagen HEIC',
  'application/pdf': 'Documento PDF',
  'application/msword': 'Documento Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'Documento Word',
  'application/vnd.ms-excel': 'Hoja de calculo Excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    'Hoja de calculo Excel',
  'application/vnd.ms-powerpoint': 'Presentacion PowerPoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'Presentacion PowerPoint',
  'text/csv': 'Archivo CSV',
  'video/mp4': 'Video MP4',
  'video/quicktime': 'Video QuickTime',
  'video/webm': 'Video WebM',
  'audio/mpeg': 'Audio MP3',
  'audio/mp3': 'Audio MP3',
  'audio/wav': 'Audio WAV',
  'audio/ogg': 'Audio OGG',
  'application/zip': 'Archivo ZIP',
  'application/x-zip-compressed': 'Archivo ZIP',
  'application/x-rar-compressed': 'Archivo RAR',
  'application/x-7z-compressed': 'Archivo 7Z',
  'application/gzip': 'Archivo GZIP',
  'application/x-tar': 'Archivo TAR',
  'text/plain': 'Texto plano',
  'application/json': 'Archivo JSON',
  'text/typescript': 'Codigo TypeScript',
  'application/typescript': 'Codigo TypeScript',
  'text/javascript': 'Codigo JavaScript',
  'application/javascript': 'Codigo JavaScript',
  'text/html': 'Codigo HTML',
  'text/css': 'Codigo CSS',
  'application/xml': 'Archivo XML',
  'text/xml': 'Archivo XML',
};

/**
 * Human, Spanish-friendly label for a mime type. NEVER returns the raw mime:
 * unknown types fall back to a sensible label derived from the mime family.
 *
 * @example friendlyType('image/png')       // "Imagen PNG"
 * @example friendlyType('application/pdf')  // "Documento PDF"
 * @example friendlyType('audio/flac')       // "Audio FLAC"
 */
export function friendlyType(mime: string): string {
  if (!mime) return 'Archivo';
  const key = mime.toLowerCase().trim();
  const known = MIME_LABELS[key];
  if (known) return known;

  const [type, subtypeRaw = ''] = key.split('/');
  const subtype = subtypeRaw
    .split(';')[0]
    .split('+')[0]
    .replace(/^x-/, '')
    .toUpperCase();

  switch (type) {
    case 'image':
      return subtype ? `Imagen ${subtype}` : 'Imagen';
    case 'video':
      return subtype ? `Video ${subtype}` : 'Video';
    case 'audio':
      return subtype ? `Audio ${subtype}` : 'Audio';
    case 'text':
      return 'Documento de texto';
    case 'font':
      return 'Fuente tipografica';
    case 'application':
      return subtype ? `Archivo ${subtype}` : 'Archivo';
    default:
      return 'Archivo';
  }
}

/**
 * Spanish relative time versus "now" (evaluated at call time).
 *
 * @example relativeTime(fiveMinAgo)   // "hace 5 min"
 * @example relativeTime(yesterday)    // "ayer"
 * @example relativeTime(threeWeeks)   // "hace 3 semanas"
 */
export function relativeTime(iso: string | Date): string {
  const then = typeof iso === 'string' ? new Date(iso).getTime() : iso.getTime();
  if (Number.isNaN(then)) return '';

  let diff = Date.now() - then;
  if (diff < 0) diff = 0;

  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);
  const week = Math.floor(day / 7);
  const month = Math.floor(day / 30);
  const year = Math.floor(day / 365);

  if (min < 1) return 'hace un momento';
  if (min < 60) return min === 1 ? 'hace 1 min' : `hace ${min} min`;
  if (hour < 24) return hour === 1 ? 'hace 1 hora' : `hace ${hour} horas`;
  if (day === 1) return 'ayer';
  if (day < 7) return `hace ${day} dias`;
  if (week < 5) return week === 1 ? 'hace 1 semana' : `hace ${week} semanas`;
  if (month < 12) return month === 1 ? 'hace 1 mes' : `hace ${month} meses`;
  return year === 1 ? 'hace 1 año' : `hace ${year} años`;
}

const CODE_MIMES = new Set([
  'application/json',
  'text/typescript',
  'application/typescript',
  'text/javascript',
  'application/javascript',
  'text/html',
  'text/css',
  'application/xml',
  'text/xml',
  'text/x-python',
  'application/x-sh',
  'text/x-java-source',
]);

/**
 * Bucket a mime type into a coarse kind used to select icons and colors.
 * Order matters: more specific application subtypes are matched before the
 * generic `text/*` fallthrough.
 */
export function fileKind(mime: string): FileKind {
  const m = (mime ?? '').toLowerCase().trim();
  if (!m) return 'other';
  if (m === 'inode/directory' || m === 'folder') return 'folder';

  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('audio/')) return 'audio';

  if (m === 'application/pdf') return 'pdf';

  if (
    m.includes('word') ||
    m === 'application/msword' ||
    m === 'application/rtf' ||
    m === 'application/vnd.oasis.opendocument.text'
  ) {
    return 'doc';
  }

  if (
    m.includes('spreadsheet') ||
    m.includes('excel') ||
    m === 'text/csv' ||
    m === 'application/vnd.oasis.opendocument.spreadsheet'
  ) {
    return 'sheet';
  }

  if (
    m.includes('presentation') ||
    m.includes('powerpoint') ||
    m === 'application/vnd.oasis.opendocument.presentation'
  ) {
    return 'slide';
  }

  if (
    m.includes('zip') ||
    m.includes('compressed') ||
    m.includes('rar') ||
    m.includes('7z') ||
    m.includes('tar') ||
    m === 'application/gzip'
  ) {
    return 'archive';
  }

  if (CODE_MIMES.has(m) || m.includes('typescript') || m.includes('javascript')) {
    return 'code';
  }

  if (m.startsWith('text/')) return 'text';

  return 'other';
}
