export function initContactCard(root) {
  if (!root || root.dataset.ready === 'true') return;

  const button = root.querySelector('#ab-save-contact');
  if (!button) return;

  root.dataset.ready = 'true';

  button.addEventListener('click', () => {
    const phone = root.querySelector('[href^="tel:"]')?.getAttribute('href')?.replace('tel:', '') || '';
    const email = root.querySelector('[href^="mailto:"]')?.getAttribute('href')?.replace('mailto:', '') || '';
    const telegram = root.querySelector('[href*="t.me"]')?.getAttribute('href') || '';

    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Баглай;Анна;;;',
      'FN:Анна Баглай',
      'TITLE:Luxury Travel Advisor',
      phone ? `TEL;TYPE=CELL:${phone}` : '',
      email ? `EMAIL;TYPE=INTERNET:${email}` : '',
      telegram ? `URL:${telegram}` : '',
      'NOTE:Culture Travel — culture-travel.ru',
      'END:VCARD',
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
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
