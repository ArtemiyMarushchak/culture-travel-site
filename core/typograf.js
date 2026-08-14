/**
 * Висящие предлоги / короткие слова: неразрывный пробел.
 * Новые новости и кейсы проходят через applyI18n / карточки — править вручную не нужно.
 */

const NBSP = '\u00A0';

const RU =
  /(^|[\s(«„"'])((?:в|во|на|по|из|и|к|ко|о|об|обо|от|до|за|со|с|у|не|ни|но|а|да|или|либо|для|без|при|про|над|под|через|между|это))\s+/gi;

const EN =
  /(^|[\s("'])((?:a|an|the|of|to|in|on|and|or|for|at|by|from|with))\s+/gi;

export function typograf(text, lang = 'ru') {
  if (!text || typeof text !== 'string') return text;

  let out = text.replace(/\u00A0/g, ' ');
  out = out.replace((lang === 'en' ? EN : RU), `$1$2${NBSP}`);
  out = out.replace(/(\d+)\s+(?=\S)/g, `$1${NBSP}`);
  out = out.replace(/(\S{1,16})\s+(\S{1,12}[.,:;!?…»"]?)$/u, `$1${NBSP}$2`);
  return out;
}
