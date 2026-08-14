import faq from './faq.json';

export const faqGroups = faq.groups;

/** Liefert einzelne FAQ-Gruppen in der angegebenen Reihenfolge. */
export function faqGroupsById(...ids) {
  return ids
    .map((id) => faqGroups.find((group) => group.id === id))
    .filter(Boolean);
}

/** Baut das FAQPage-Markup aus beliebig vielen Gruppen. */
export function faqJsonLd(groups) {
  const items = groups.flatMap((group) => group.items);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
