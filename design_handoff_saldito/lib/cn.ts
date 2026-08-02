/** Une classNames descartando valores falsy. Sin dependencias. */
export function cn(...partes: Array<string | false | null | undefined>): string {
  return partes.filter(Boolean).join(' ');
}
