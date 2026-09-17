export function initContactCard(root) {
  if (!root || root.dataset.ready === 'true') return;

  const button = root.querySelector('#ab-save-contact');
  if (!button) return;

  root.dataset.ready = 'true';

  button.addEventListener('click', () => {
    const phone = root.querySelector('[href^="tel:"]')?.getAttribute('href')?.replace('tel:', '') || '';
    const email = root.querySelector('[href^="mailto:"]')?.getAttribute('href')?.replace('mailto:', '') || '';
    const telegram = root.querySelector('[href*="t.me"]')?.getAttribute('href') || '';
    const siteUrl = 'https://culture-travel.ru';
    const digits = phone.replace(/\D/g, '');
    const tel = phone.startsWith('+') ? `+${digits}` : (digits.length === 11 && digits.startsWith('7') ? `+${digits}` : digits);
    const tgHandle = telegram.replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '').replace(/^@/, '');

    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Баглай;Анна;;;',
      'FN:Анна Баглай',
      'ORG:Культура Путешествий',
      'TITLE:Режиссёр индивидуальных туров',
      tel ? `TEL;TYPE=CELL,VOICE:${tel}` : '',
      email ? `EMAIL;TYPE=INTERNET:${email}` : '',
      `URL;TYPE=WORK:${siteUrl}`,
      `item1.URL;TYPE=pref:${siteUrl}`,
      'item1.X-ABLabel:Сайт',
      telegram ? `item2.URL:${telegram}` : '',
      telegram ? 'item2.X-ABLabel:Telegram' : '',
      telegram ? `X-SOCIALPROFILE;TYPE=telegram:${telegram}` : '',
      tgHandle ? `IMPP:x-apple:telegram:${tgHandle}` : '',
      'NOTE:Culture Travel — режиссёр индивидуальных туров',
      'END:VCARD',
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([`${vcard}\r\n`], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'Anna_Baglay.vcf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
