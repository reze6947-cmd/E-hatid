import { Plugin, ResolvedConfig } from 'vite';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { SITE_URL } from './src/config/seo';

const xmlEscape = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const lastModified = () => new Date().toISOString().split('T')[0];

interface StallRecord {
  name?: string;
  id?: string;
}

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

const staticRoutes: SitemapEntry[] = [
  { loc: '/', lastmod: '', changefreq: 'weekly', priority: '1.0' },
  { loc: '/guest/home', lastmod: '', changefreq: 'weekly', priority: '0.9' },
  { loc: '/blog', lastmod: '', changefreq: 'weekly', priority: '0.6' },
  { loc: '/help', lastmod: '', changefreq: 'monthly', priority: '0.6' },
];

async function fetchStallIds(projectId: string, apiKey: string): Promise<StallRecord[]> {
  const base =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    `/databases/(default)/documents/stalls?pageSize=300&key=${encodeURIComponent(apiKey)}`;
  const records: StallRecord[] = [];
  let pageToken = '';
  do {
    const url = `${base}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Firestore stalls fetch failed: HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      documents?: { fields?: { name?: { stringValue?: string }; id?: { stringValue?: string } } }[];
      nextPageToken?: string;
    };
    for (const doc of data.documents ?? []) {
      records.push({
        name: doc.fields?.name?.stringValue,
        id: doc.fields?.id?.stringValue,
      });
    }
    pageToken = data.nextPageToken ?? '';
  } while (pageToken);
  return records;
}

export function sitemapPlugin(): Plugin {
  let config: ResolvedConfig | undefined;

  return {
    name: 'generate-sitemap',
    apply: 'build',
    configResolved(resolved) {
      config = resolved;
    },
    async closeBundle() {
      const entries: SitemapEntry[] = staticRoutes.map((route) => ({
        ...route,
        lastmod: lastModified(),
      }));

      const projectId = config?.env.VITE_FIREBASE_PROJECT_ID;
      const apiKey = config?.env.VITE_FIREBASE_API_KEY;

      if (projectId && apiKey) {
        try {
          const stalls = await fetchStallIds(projectId, apiKey);
          for (const stall of stalls) {
            if (!stall.id) continue;
            entries.push({
              loc: `/stall/${encodeURIComponent(stall.id)}/menu`,
              lastmod: lastModified(),
              changefreq: 'weekly',
              priority: '0.8',
            });
          }
          console.log(
            `[sitemap] Added ${stalls.length} stall URL(s) from Firestore.`
          );
        } catch (err) {
          console.warn(
            `[sitemap] Could not fetch stalls from Firestore (${(err as Error).message}). Sitemap will include static routes only.`
          );
        }
      } else {
        console.warn(
          '[sitemap] VITE_FIREBASE_PROJECT_ID / VITE_FIREBASE_API_KEY not set in env; sitemap will include static routes only.'
        );
      }

      const urls = entries
        .map((entry) => {
          const loc = `${SITE_URL}${entry.loc}`;
          return [
            '  <url>',
            `    <loc>${xmlEscape(loc)}</loc>`,
            `    <lastmod>${entry.lastmod}</lastmod>`,
            `    <changefreq>${entry.changefreq}</changefreq>`,
            `    <priority>${entry.priority}</priority>`,
            '  </url>',
          ].join('\n');
        })
        .join('\n');

      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        urls,
        '</urlset>',
        '',
      ].join('\n');

      const outDir = process.env.VITE_OUT_DIR || 'dist';
      await mkdir(outDir, { recursive: true });
      await writeFile(path.join(outDir, 'sitemap.xml'), xml, 'utf8');
      console.log(`[sitemap] Wrote ${entries.length} URL(s) to ${outDir}/sitemap.xml`);
    },
  };
}
