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
    eyebrow: 'Energie, Phoenix und Leck-Signale',
    description:
      'MOMUS liest im Portal die freigegebenen Energie-Zusammenfassungen, Phoenix-Werte und Tages-Signale aus dem Callidus Hub.',
    icon: '/handbuch/assets/logo_momus.png',
    color: 'violet',
    href: '/portal/momus/',
    appHref: '/apps/',
    cta: 'MOMUS Status ansehen',
  },
  kairos: {
    id: 'kairos',
    name: 'KAIROS',
    title: 'KAIROS im Portal',
    eyebrow: 'Mentale Begleitung, Erinnerungen und Kontext',
    description:
      'KAIROS zeigt Profil, Erinnerungen, aktuelle Impulse und die Verbindung zu NEXUS und MOMUS im gemeinsamen Portal.',
    icon: '/handbuch/assets/logo_kairos.png',
    color: 'blue',
    href: '/portal/kairos/',
    appHref: '/apps/',
    cta: 'KAIROS Status ansehen',
  },
};

export const portalAppList = Object.values(portalApps);
