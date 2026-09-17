/**
 * Переводы UI-chrome. Контент страниц остаётся на исходном языке, пока нет перевода.
 */

import { typograf } from './typograf.js';

export const STRINGS = {
  ru: {
    'legal.label': 'Документ',
    'legal.crumbs': 'Хлебные крошки',
    'skip': 'Перейти к содержимому',
    'nav.about': 'Обо мне',
    'nav.home': 'Главная',
    'nav.cases': 'Кейсы',
    'nav.services': 'Услуги',
    'nav.tours': 'Авторские туры',
    'nav.reviews': 'Отзывы',
    'nav.news': 'Новости',
    'nav.hotels': 'Отели',
    'nav.cruises': 'Круизы',
    'nav.aviation': 'Бизнес авиация',
    'news.label': 'Новости',
    'news.title': 'Новости',
    'news.loadMore': 'Показать ещё',
    'news.read': 'Читать новость',
    'cta.contact': 'Связаться со мной',
    'header.brandName': 'Анна',
    'header.brandRole': 'Культуры путешествия',
    'header.menuOpen': 'Открыть меню',
    'header.menuClose': 'Закрыть меню',
    'header.themeToDark': 'Тёмная тема',
    'header.themeToLight': 'Светлая тема',
    'header.lang': 'Язык',
    'header.langToEn': 'English',
    'header.langToRu': 'Русский',
    'header.search': 'Поиск',
    'header.changeTheme': 'Сменить тему',
    'header.changeLang': 'Сменить язык',
    'search.placeholder': 'Поиск по сайту',
    'search.empty': 'Ничего не нашлось',
    'search.hint': 'Авторские туры, новости, отели и разделы сайта',
    'hero.title': 'Открываем мир за кадром',
    'hero.lead': 'Организуя путешествия с вниманием к каждой детали',
    'about.name': 'Анна Баглай',
    'about.role': 'Делаю путешествия в сегменте люкс',
    'about.p1': '19 лет работаю в туристической индустрии, специализируюсь на организации персональных путешествий по всему миру.',
    'about.p2': 'Основное направление моей работы — создание уникальных маршрутов: от премиальных пляжных курортов и лучших отелей мира до сложных индивидуальных программ, семейных путешествий и экспедиционных маршрутов в самые интересные и удалённые уголки мира.',
    'about.p3': 'Работаю преимущественно с постоянными клиентами, для которых важны высокий уровень сервиса, внимание к деталям и долгосрочные отношения.',
    'about.p4': 'Каждая поездка создаётся индивидуально — с учётом интересов, привычек и ожиданий гостей.',
    'about.photoAlt': 'Анна Баглай — делаю путешествия в сегменте люкс',
    'about.close': 'Закрыть',
    'about.phone': 'Телефон',
    'about.email': 'Email',
    'about.telegram': 'Telegram',
    'about.write': 'Написать в Telegram',
    'about.save': 'Сохранить контакт',
    'cases.title': 'Мои кейсы',
    'services.title': 'Мои услуги',
    'reviews.loadMore': 'Показать ещё',
    'services.prev': 'Предыдущая услуга',
    'services.next': 'Следующая услуга',
    'cases.region': 'Направление',
    'cases.duration': 'Длительность',
    'cases.allDays': 'Все сроки',
    'cases.days': 'дней',
    'cases.daysShort': 'дн',
    'cases.more': 'Подробнее',
    'cases.prev': 'Предыдущие кейсы',
    'cases.next': 'Следующие кейсы',
    'region.all': 'Все направления',
    'region.africa': 'Африка',
    'region.asia': 'Азия',
    'region.europe': 'Европа',
    'region.southAmerica': 'Южная Америка',
    'region.northAmerica': 'Северная Америка',
    'region.australia': 'Австралия',
    'region.antarctica': 'Антарктида',
    'footer.home': 'Главная',
    'footer.privacyShort': 'Приватность',
    'footer.wordmark': 'Культура путешествия',
    'footer.explore': 'Разделы',
    'footer.nav': 'Навигация',
    'footer.contacts': 'Контакты',
    'footer.companyData': 'Данные компании',
    'footer.requisites': 'Реквизиты',
    'footer.mail': 'Почта',
    'footer.rta': 'Реестровый номер РТА',
    'footer.privacy': 'Политика конфиденциальности',
    'footer.registry': 'Включена в единый реестр турагентов',
    'footer.registryShort': 'Реестр Турагенств',
    'footer.copyright': 'Авторское право',
    'footer.copyban': 'Копирование с сайта любого контента запрещено',
    'footer.dev': 'Разработал —',
    'footer.inn': 'ИНН',
    'footer.ogrn': 'ОГРН',
    'footer.phone': 'Телефон',
    'footer.email': 'Email',
    'footer.telegram': 'Telegram',
    'footer.moscow': 'Москва',
    'footer.toTop': 'Наверх',
    'footer.nodata': 'Сайт не собирает и не хранит данные посетителя',
    'footer.partners': 'Партнёры',
    'error.title': 'Страница не найдена',
    'error.text': 'Возможно, адрес был изменён или страница временно недоступна. Вернитесь на главную.',
    'error.home': 'На главную',
    'error.contact': 'Связаться',
    'stub.inProgress': 'Страница находится в разработке',
    'tours.title': 'Программы Culture Travel',
    'tours.lead': 'Индивидуальные маршруты — каждый собирается под гостей, без готовых пакетов.',
    'hotels.label': 'Отели',
    'hotels.title': 'Эксклюзивные отели мира',
    'hotels.lead': 'Каталог тематических люкс-отелей — для тех, кто ценит атмосферу, сервис и уникальность.',
    'hotels.filters': 'Фильтры',
    'hotels.all': 'Все',
    'hotels.beach': 'Пляж',
    'hotels.city': 'Город',
    'hotels.mountain': 'Горы',
    'hotels.safari': 'Safari',
    'hotels.more': 'Подробнее',
    'hotels.media': 'Фото и видео',
    'hotels.item': 'Отель',
    'about.emailLong': 'Электронная почта',
    'contact.label': 'Контакты',
    'contact.title': 'Обсудим ваше путешествие',
    'contact.lead': 'Работаем только с индивидуальными запросами. Напишите — и мы создадим маршрут специально для вас.',
    'contact.write': 'Написать на email',
    'cases.label': 'Кейс',
  },
  en: {
    'legal.label': 'Document',
    'legal.crumbs': 'Breadcrumbs',
    'skip': 'Skip to content',
    'nav.about': 'About',
    'nav.home': 'Home',
    'nav.cases': 'Cases',
    'nav.services': 'Services',
    'nav.tours': 'Private tours',
    'nav.reviews': 'Reviews',
    'nav.news': 'News',
    'nav.hotels': 'Hotels',
    'nav.cruises': 'Cruises',
    'nav.aviation': 'Business aviation',
    'news.label': 'News',
    'news.title': 'News',
    'news.loadMore': 'Show more',
    'news.read': 'Read story',
    'cta.contact': 'Enquire privately',
    'header.brandName': 'Anna',
    'header.brandRole': 'Cultures of Travel',
    'header.menuOpen': 'Open menu',
    'header.menuClose': 'Close menu',
    'header.themeToDark': 'Dark theme',
    'header.themeToLight': 'Light theme',
    'header.lang': 'Language',
    'header.langToEn': 'English',
    'header.langToRu': 'Русский',
    'header.search': 'Search',
    'header.changeTheme': 'Change theme',
    'header.changeLang': 'Change language',
    'search.placeholder': 'Search the site',
    'search.empty': 'Nothing found',
    'search.hint': 'Private tours, news, hotels and site sections',
    'hero.title': 'Discovering the world behind the scenes',
    'hero.lead': 'crafting every journey with attention to the finest detail',
    'about.name': 'Anna Baglay',
    'about.role': 'I create luxury travel',
    'about.p1': 'I have worked in the travel industry for 19 years, specializing in private journeys around the world.',
    'about.p2': 'My work is building original itineraries: from premium beach resorts and the world’s best hotels to complex private programmes, family travel and expedition routes into remote, remarkable places.',
    'about.p3': 'I work mainly with returning clients who value a high level of service, attention to detail and long-term relationships.',
    'about.p4': 'Every trip is composed individually — around the interests, habits and expectations of the guests.',
    'about.photoAlt': 'Anna Baglay — luxury travel director',
    'about.close': 'Close',
    'about.phone': 'Phone',
    'about.email': 'Email',
    'about.telegram': 'Telegram',
    'about.write': 'Message on Telegram',
    'about.save': 'Save contact',
    'cases.title': 'My cases',
    'services.title': 'My services',
    'reviews.loadMore': 'Show more',
    'services.prev': 'Previous service',
    'services.next': 'Next service',
    'cases.region': 'Destination',
    'cases.duration': 'Duration',
    'cases.allDays': 'Any length',
    'cases.days': 'days',
    'cases.daysShort': 'd',
    'cases.more': 'Read more',
    'cases.prev': 'Previous cases',
    'cases.next': 'Next cases',
    'region.all': 'All destinations',
    'region.africa': 'Africa',
    'region.asia': 'Asia',
    'region.europe': 'Europe',
    'region.southAmerica': 'South America',
    'region.northAmerica': 'North America',
    'region.australia': 'Australia',
    'region.antarctica': 'Antarctica',
    'footer.home': 'Home',
    'footer.privacyShort': 'Privacy',
    'footer.wordmark': 'The culture of travel',
    'footer.explore': 'Explore',
    'footer.nav': 'Navigation',
    'footer.contacts': 'Contacts',
    'footer.companyData': 'Company details',
    'footer.requisites': 'Details',
    'footer.mail': 'Email',
    'footer.rta': 'RTA registry number',
    'footer.privacy': 'Privacy policy',
    'footer.registry': 'Listed in the unified travel agents register',
    'footer.registryShort': 'Travel Agents Registry',
    'footer.copyright': 'Copyright',
    'footer.copyban': 'Copying any content from the site is prohibited',
    'footer.dev': 'Designed by —',
    'footer.inn': 'INN',
    'footer.ogrn': 'OGRN',
    'footer.phone': 'Phone',
    'footer.email': 'Email',
    'footer.telegram': 'Telegram',
    'footer.moscow': 'Moscow',
    'footer.toTop': 'Back to top',
    'footer.nodata': 'This site does not collect or store visitor data',
    'footer.partners': 'Partners',
    'error.title': 'Page not found',
    'error.text': 'The address may have changed, or the page is temporarily unavailable. Please return to the home page.',
    'error.home': 'Back home',
    'error.contact': 'Get in touch',
    'stub.inProgress': 'This page is under development',
    'tours.title': 'Culture Travel programmes',
    'tours.lead': 'Private itineraries — each one composed for the guests, with no ready-made packages.',
    'hotels.label': 'Hotels',
    'hotels.title': 'Exclusive hotels worldwide',
    'hotels.lead': 'A catalogue of characterful luxury hotels — for those who value atmosphere, service and rarity.',
    'hotels.filters': 'Filters',
    'hotels.all': 'All',
    'hotels.beach': 'Beach',
    'hotels.city': 'City',
    'hotels.mountain': 'Mountains',
    'hotels.safari': 'Safari',
    'hotels.more': 'Read more',
    'hotels.media': 'Photos and video',
    'hotels.item': 'Hotel',
    'about.emailLong': 'Email',
    'contact.label': 'Contact',
    'contact.title': 'Let’s talk about your journey',
    'contact.lead': 'We take private enquiries only. Write — and we will compose an itinerary specifically for you.',
    'contact.write': 'Write by email',
    'cases.label': 'Case',
  },
};

export function getLang() {
  const lang = document.documentElement.getAttribute('data-lang');
  return lang === 'en' ? 'en' : 'ru';
}

export function t(key) {
  const pack = STRINGS[getLang()] || STRINGS.ru;
  return pack[key] || STRINGS.ru[key] || key;
}

export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    const value = typograf(t(key), getLang());
    if (value) el.textContent = value;
  });

  root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    if (!key) return;
    const value = t(key);
    if (value) {
      el.setAttribute('aria-label', value);
      if (el.tagName === 'IMG') el.setAttribute('alt', value);
    }
  });

  const lang = getLang();
  root.querySelectorAll('[data-i18n-src]').forEach((el) => {
    const value = typograf(el.getAttribute(lang === 'en' ? 'data-en' : 'data-ru') || '', lang);
    if (value) el.textContent = value;
  });

  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const attr = el.getAttribute('data-i18n-attr');
    if (!attr) return;
    const value = el.getAttribute(lang === 'en' ? 'data-en' : 'data-ru');
    if (value != null && value !== '') el.setAttribute(attr, value);
  });

  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (!key) return;
    const value = t(key);
    if (value) el.setAttribute('placeholder', value);
  });
}

export function setLang(lang) {
  const next = lang === 'en' ? 'en' : 'ru';
  document.documentElement.setAttribute('data-lang', next);
  document.documentElement.setAttribute('lang', next);
  try {
    localStorage.setItem('ct-lang', next);
  } catch (err) {
    /* приватный режим */
  }
  applyI18n(document);
}
