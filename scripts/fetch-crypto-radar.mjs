import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const outputPath = resolve('src/data/crypto-radar.json');
const now = new Date().toISOString();

const feeds = [
  {
    name: 'BTC-ECHO',
    language: 'de',
    homeUrl: 'https://www.btc-echo.de/',
    feedUrl: 'https://www.btc-echo.de/feed/',
  },
  {
    name: 'CoinDesk',
    language: 'en',
    homeUrl: 'https://www.coindesk.com/',
    feedUrl: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
  },
  {
    name: 'Decrypt',
    language: 'en',
    homeUrl: 'https://decrypt.co/',
    feedUrl: 'https://decrypt.co/feed',
  },
  {
    name: 'Cointelegraph',
    language: 'en',
    homeUrl: 'https://cointelegraph.com/',
    feedUrl: 'https://cointelegraph.com/rss',
  },
];

const categoryRules = [
  {
    label: 'Sicherheit',
    slug: 'sicherheit',
    pattern: /hack|hacker|exploit|scam|phish|rug|malware|drain|breach|attack|security|betrug|warnung|sicher|gestohlen|wallet[- ]?drainer/i,
    awareness: 'Langsam klicken: Links, Wallet-Verbindungen und Signaturen lieber doppelt prüfen.',
  },
  {
    label: 'Regulierung',
    slug: 'regulierung',
    pattern: /sec|cftc|bafin|mica|eu |europe|senate|congress|court|lawsuit|regulat|gesetz|steuer|haltefrist|etf|aufsicht|behörde|verbot/i,
    awareness: 'Regeln ändern den Rahmen: wichtig für Plattformen, Steuern und Verfügbarkeit.',
  },
  {
    label: 'Bitcoin & Ethereum',
    slug: 'bitcoin-ethereum',
    pattern: /bitcoin|btc|ethereum|ether| eth |spot etf|staking|layer 2|rollup|base|arbitrum|optimism/i,
    awareness: 'Große Netzwerke bewegen oft den Markt, sind aber trotzdem kein Kaufsignal.',
  },
  {
    label: 'Memecoins',
    slug: 'memecoins',
    pattern: /meme|memecoin|doge|dogecoin|shib|pepe|bonk|floki|pump\.fun|pumpfun|trump coin|\btrump\b|solana meme/i,
    awareness: 'Bei Memecoins besonders Tokenomics, Liquidity, Wallet-Verteilung und Hype-Druck prüfen.',
  },
  {
    label: 'Bridges & Wallets',
    slug: 'bridges-wallets',
    pattern: /bridge|wallet|metamask|phantom|ledger|trezor|dex|defi|uniswap|aave|swap|gas fee|network fee/i,
    awareness: 'Vor Transaktionen Netzwerk, Gas-Coin, Zieladresse und Bridge-Gebühren kontrollieren.',
  },
  {
    label: 'Stablecoins & Zahlungen',
    slug: 'stablecoins',
    pattern: /stablecoin|usdt|usdc|tether|circle|payment|payments|zahl|paypal|stripe/i,
    awareness: 'Stablecoins wirken ruhig, hängen aber an Emittenten, Reserven, Chains und Regulierung.',
  },
];

const defaultAwareness =
  'Als Marktinformation lesen, nicht als Handlungssignal. Erst prüfen, dann entscheiden.';
const blockedTitlePattern = /press release|sponsored|advertorial|partner content|anzeige|werbung|what happened in crypto today/i;

const entityMap = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
  auml: 'ä',
  Auml: 'Ä',
  ouml: 'ö',
  Ouml: 'Ö',
  uuml: 'ü',
  Uuml: 'Ü',
  szlig: 'ß',
};

const decodeEntities = (value = '') =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&([a-zA-Z]+);/g, (match, name) => entityMap[name] || match);

const cleanText = (value = '') =>
  decodeEntities(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tagValue = (block, tagName) => {
  const match = block.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? cleanText(match[1]) : '';
};

const linkValue = (block) => {
  const atomLink = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i);
  if (atomLink) return decodeEntities(atomLink[1]).trim();
  return tagValue(block, 'link');
};

const safeUrl = (value, fallback) => {
  try {
    return new URL(value, fallback).href;
  } catch {
    return '';
  }
};

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? now : date.toISOString();
};

const categorize = (title) => {
  const rule = categoryRules.find((entry) => entry.pattern.test(title));
  return rule
    ? { category: rule.label, categorySlug: rule.slug, awareness: rule.awareness }
    : { category: 'Markt & Infrastruktur', categorySlug: 'markt-infrastruktur', awareness: defaultAwareness };
};

const hashId = (value) => createHash('sha1').update(value).digest('hex').slice(0, 12);

const parseFeed = (xml, feed) => {
  const blocks = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => match[0]);
  const atomBlocks = blocks.length ? [] : [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((match) => match[0]);

  return [...blocks, ...atomBlocks]
    .map((block) => {
      const title = tagValue(block, 'title');
      const url = safeUrl(linkValue(block) || tagValue(block, 'guid'), feed.homeUrl);
      const publishedAt = parseDate(tagValue(block, 'pubDate') || tagValue(block, 'updated') || tagValue(block, 'published'));

      if (!title || !url || blockedTitlePattern.test(title)) return null;

      return {
        id: hashId(`${feed.name}:${url}:${title}`),
        title,
        url,
        source: feed.name,
        sourceUrl: feed.homeUrl,
        language: feed.language,
        publishedAt,
        sourceType: 'rss',
        ...categorize(title),
      };
    })
    .filter(Boolean);
};

const fetchText = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      headers: {
        accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
        'user-agent': 'CallidusCryptoRadar/1.0 (+https://www.callidus-am.de/krypto-verstehen/)',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
};

const previousData = () => {
  if (!existsSync(outputPath)) return null;
  try {
    return JSON.parse(readFileSync(outputPath, 'utf8'));
  } catch {
    return null;
  }
};

const selectItems = (items) => {
  const seen = new Set();
  const sourceCount = new Map();
  const sorted = items
    .filter((item) => {
      const key = item.title.toLowerCase().replace(/[^a-z0-9äöüß]+/gi, ' ').trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  const selected = [];
  const addItem = (item) => {
    if (selected.some((entry) => entry.id === item.id)) return false;
    selected.push(item);
    sourceCount.set(item.source, (sourceCount.get(item.source) || 0) + 1);
    return true;
  };

  for (const feed of feeds) {
    const item = sorted.find((entry) => entry.source === feed.name);
    if (item) addItem(item);
    if (selected.length >= 9) return selected;
  }

  for (const item of sorted) {
    const count = sourceCount.get(item.source) || 0;
    if (count >= 3) continue;
    addItem(item);
    if (selected.length >= 9) break;
  }

  return selected;
};

const run = async () => {
  const sourceResults = [];
  const fetchedItems = [];

  for (const feed of feeds) {
    try {
      const xml = await fetchText(feed.feedUrl);
      const items = parseFeed(xml, feed);
      fetchedItems.push(...items);
      sourceResults.push({ ...feed, status: 'ok', itemCount: items.length });
    } catch (error) {
      sourceResults.push({ ...feed, status: 'error', itemCount: 0, error: error.message });
    }
  }

  const items = selectItems(fetchedItems);
  const okCount = sourceResults.filter((source) => source.status === 'ok').length;
  let payload;

  if (items.length) {
    payload = {
      generatedAt: now,
      checkedAt: now,
      status: okCount === feeds.length ? 'live' : 'partial',
      updateCadence: 'GitHub Pages baut den Radar regelmäßig aus gecachten RSS-Feeds neu.',
      disclaimer: 'Automatisch kuratierte Nachrichtenübersicht. Keine Anlageberatung und kein Kaufsignal.',
      sources: sourceResults,
      items,
    };
  } else {
    const previous = previousData();
    payload = {
      ...(previous || {}),
      checkedAt: now,
      status: previous?.items?.length ? 'stale' : 'empty',
      updateCadence: 'Die Feeds waren beim letzten Lauf nicht erreichbar.',
      disclaimer: 'Automatisch kuratierte Nachrichtenübersicht. Keine Anlageberatung und kein Kaufsignal.',
      sources: sourceResults,
      items: previous?.items || [],
    };
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Crypto radar: ${payload.status}, ${payload.items.length} items, ${okCount}/${feeds.length} feeds ok.`);
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
