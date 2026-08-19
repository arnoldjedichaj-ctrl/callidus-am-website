export const portalApps = {
  nexus: {
    id: 'nexus',
    name: 'NEXUS',
    title: 'NEXUS im Portal',
    eyebrow: 'Gesundheitsprofil, Ernaehrung und Tageswerte',
    description:
      'NEXUS zeigt im Portal die wichtigsten Tageswerte, Plaene, Mahlzeiten und Journal-Signale aus dem vorhandenen Firebase-Konto.',
    icon: '/handbuch/assets/app_icon_nexus.png',
    color: 'mint',
    href: '/portal/nexus/',
    appHref: '/nexus-app/',
    playHref: 'https://play.google.com/store/apps/details?id=de.callidus.app',
    cta: 'NEXUS App ansehen',
  },
  momus: {
    id: 'momus',
    name: 'MOMUS',
    title: 'MOMUS im Portal',
    eyebrow: 'Energie, Phoenix-Werte und Tages-Signale',
    description:
      'MOMUS zeigt im Portal deine Energie-Zusammenfassungen, Phoenix-Werte und Tages-Signale aus dem vorhandenen Firebase-Konto.',
    icon: '/handbuch/assets/logo_momus.png',
    color: 'violet',
    href: '/portal/momus/',
    appHref: '/nexus-app/',
    playHref: 'https://play.google.com/store/apps/details?id=de.callidusam.momus',
    cta: 'MOMUS App ansehen',
  },
  kairos: {
    id: 'kairos',
    name: 'KAIROS',
    title: 'KAIROS im Portal',
    eyebrow: 'Profil, Erinnerungen und mentale Begleitung',
    description:
      'KAIROS zeigt im Portal dein Profil, deine Erinnerungen und den Kontext deiner mentalen Begleitung aus dem vorhandenen Firebase-Konto.',
    icon: '/handbuch/assets/logo_kairos.png',
    color: 'blue',
    href: '/portal/kairos/',
    appHref: '/nexus-app/',
    playHref: 'https://play.google.com/store/apps/details?id=de.callidusam.kairos',
    cta: 'KAIROS App ansehen',
  },
};

export const portalAppList = Object.values(portalApps);

export const portalCoachLink = {
  id: 'coach',
  name: 'Coach',
  title: 'Sport & Energie Coach',
  href: '/portal/coach/',
};

export const portalNavList = [...portalAppList, portalCoachLink];
