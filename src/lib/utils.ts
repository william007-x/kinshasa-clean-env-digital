import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
}

export function formatDate(date: string | Date, pattern = 'dd MMM yyyy'): string {
  return format(new Date(date), pattern, { locale: fr });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd MMM yyyy 'à' HH:mm", { locale: fr });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function classNames(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

const KINSHASA_CENTER: [number, number] = [-4.325, 15.3022];

export const KINSHASA_COMMUNES_COORDS: Record<string, [number, number]> = {
  bandalungwa: [-4.3417, 15.2833],
  baramito: [-4.3389, 15.3139],
  binza: [-4.3789, 15.2511],
  bumbu: [-4.3583, 15.2833],
  gombe: [-4.3217, 15.3056],
  kalamu: [-4.3389, 15.2917],
  'kasa-vubu': [-4.3417, 15.2989],
  kimbanseke: [-4.3917, 15.3511],
  kinshasa: [-4.325, 15.3022],
  kintambo: [-4.3356, 15.2889],
  lemba: [-4.3611, 15.3217],
  limete: [-4.3356, 15.3156],
  lingwala: [-4.3294, 15.3089],
  makala: [-4.3556, 15.3283],
  maluku: [-4.4756, 15.5667],
  masina: [-4.3833, 15.3889],
  matete: [-4.3489, 15.3217],
  'mont-ngafula': [-4.3917, 15.2683],
  ndjili: [-4.4083, 15.3556],
  ngaba: [-4.3528, 15.3283],
  ngaliema: [-4.3556, 15.2789],
  'ngiri-ngiri': [-4.3356, 15.3017],
  nsele: [-4.4417, 15.4667],
  selembao: [-4.3556, 15.2683],
};

export { KINSHASA_CENTER };
