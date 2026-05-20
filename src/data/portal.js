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
    cta: 'NEXUS App ansehen',
  },
  momus: {
    id: 'momus',
    name: 'MOMUS',
    title: 'MOMUS im Portal',
    eyebrow: 'Demnächst verfügbar',
    description:
      'MOMUS befindet sich noch in der Entwicklung und wird nach dem Launch automatisch hier erscheinen. Energie-Zusammenfassungen, Phoenix-Werte und Tages-Signale werden dann im Portal sichtbar.',
    icon: '/handbuch/assets/logo_momus.png',
    color: 'violet',
    href: '/portal/momus/',
    appHref: '/apps/',
    cta: 'Mehr über MOMUS',
    comingSoon: true,
  },
  kairos: {
    id: 'kairos',
    name: 'KAIROS',
    title: 'KAIROS im Portal',
    eyebrow: 'Demnächst verfügbar',
    description:
      'KAIROS befindet sich noch in der Entwicklung und wird nach dem Launch automatisch hier erscheinen. Profil, Erinnerungen und mentale Begleitung werden dann im Portal sichtbar.',
    icon: '/handbuch/assets/logo_kairos.png',
    color: 'blue',
    href: '/portal/kairos/',
    appHref: '/apps/',
    cta: 'Mehr über KAIROS',
    comingSoon: true,
  },
};

export const portalAppList = Object.values(portalApps);
