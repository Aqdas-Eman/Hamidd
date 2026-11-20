import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  AdminDataPayload,
  AdminSettings,
  GalleryItem,
  PromiseItem,
  PublicSettings,
  StepKey,
  TimelineItem,
  WishItem,
} from '../src/types/app.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'birthday-store.json');

export const DEFAULT_PAGE_ORDER: StepKey[] = [
  'gate',
  'welcome',
  'story',
  'promises',
  'gate2',
  'gallery',
  'wishes',
  'surprise',
];

const SEED_DATA: AdminDataPayload = {
  settings: {
    husbandName: 'Hamid',
    wifeName: 'Aqdas',
    coupleNames: 'Hamid & Aqdas',
    welcomeVideoUrl: '',
    welcomeVideoTitle: '',
    welcomeVideoText: '',
    welcomeVideos: [],
    heroIntro:
      'Sample welcome note — replace from admin. A quiet place celebrating our favorite memories, promises, and wishes together.',
    first_meet_date: '08042023',
    second_meet_date: '23042023',
    togetherSinceDate: '2023-04-08T18:00:00',

    gateEnabled: true,
    gateTitle: 'A little secret to unlock your birthday surprise',
    gateQuestion: 'When did we first meet?',
    hints: ['The day our forever started.'],
    wrongMessages: [
      'Wrong! Go back, you forgot our day 😤',
      'Please remember the day we first met 🥺',
      "He's crying now, try again 😭",
    ],
    extraHintAfterAttempts: '',
    gate1SuccessMessage: 'Yes! You remembered the day we first met, Hamid ❤️',

    gate2Enabled: true,
    gate2Title: 'One more memory check before our photos 💕',
    gate2Question: 'When was our second / official meetup?',
    gate2Hints: [],
    gate2WrongMessages: [
      'Not quite! Think back to our official day in April 😤',
      'Wait... did you forget our second meetup? 🥺',
      "He's tearing up again — try that April date 😭",
    ],
    gate2ExtraHint: '',
    gate2SuccessMessage: 'Yes! You remembered our official meetup, Hamid 💕',

    musicUrl: '',
    themeAccent: 'rose-gold',
    finalSurpriseTitle: 'Happy Birthday Hamid',
    finalLetter: `My dearest Hamid,

Sample love letter — replace from admin.

Wishing you a joyful birthday filled with warmth, laughter, and every good thing ahead of us. Thank you for being my partner, my calm, and my favorite person.

With all my love,
Aqdas`,
    finalMediaUrl: '',
    finalMediaType: 'image',
    visiblePages: {
      welcome: true,
      story: true,
      promises: true,
      gate2: true,
      gallery: true,
      wishes: true,
      surprise: true,
    },
    pageOrder: DEFAULT_PAGE_ORDER,
    nextButtonLabels: {
      welcome: 'Begin Our Story 💕',
      story: 'Next: My Promises 💕',
      promises: 'Next: Memory Check 💕',
      gallery: 'Next: Birthday Wishes 💕',
      wishes: 'Next: Final Surprise ✨',
    },
  },
  timeline: [
    {
      id: 'tl-1',
      dateLabel: 'April 8, 2023',
      title: 'Milestone 1 — First Meeting (Sample)',
      description: 'Sample story entry — replace from admin with your real first meeting memory.',
      imageUrl: '',
      isFirstMeeting: true,
      sort_order: 1,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'tl-2',
      dateLabel: 'April 23, 2023',
      title: 'Milestone 2 — Official Meetup (Sample)',
      description: 'Sample story entry — replace from admin with your official meetup memory.',
      imageUrl: '',
      sort_order: 2,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'tl-3',
      dateLabel: 'Sample Date III',
      title: 'Milestone 3 — Today & Ahead (Sample)',
      description: 'Sample story entry — replace from admin with your latest chapter together.',
      imageUrl: '',
      sort_order: 3,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ],
  promises: [
    {
      id: 'pr-1',
      icon: '❤️',
      title: 'Promise I (Sample)',
      text: 'Sample promise — replace from admin with your first personal promise to Hamid.',
      sort_order: 1,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'pr-2',
      icon: '🤍',
      title: 'Promise II (Sample)',
      text: 'Sample promise — replace from admin with your second personal promise.',
      sort_order: 2,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'pr-3',
      icon: '✨',
      title: 'Promise III (Sample)',
      text: 'Sample promise — replace from admin with your third personal promise.',
      sort_order: 3,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ],
  gallery: [
    {
      id: 'gal-1',
      imageUrl: '',
      caption: 'Sample photo 1 — replace from admin',
      album: 'Memories',
      capturedDate: 'Sample date',
      sort_order: 1,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'gal-2',
      imageUrl: '',
      caption: 'Sample photo 2 — replace from admin',
      album: 'Memories',
      capturedDate: 'Sample date',
      sort_order: 2,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'gal-3',
      imageUrl: '',
      caption: 'Sample photo 3 — replace from admin',
      album: 'Memories',
      capturedDate: 'Sample date',
      sort_order: 3,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ],
  wishes: [
    {
      id: 'wish-1',
      title: 'Wish I (Sample)',
      text: 'Sample birthday wish from Aqdas to Hamid — replace from admin with your real wish.',
      imageUrl: '',
      sort_order: 1,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'wish-2',
      title: 'Wish II (Sample)',
      text: 'Sample birthday wish 2 — replace from admin with another heartfelt message.',
      imageUrl: '',
      sort_order: 2,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'wish-3',
      title: 'Wish III (Sample)',
      text: 'Sample birthday wish 3 — replace from admin with your closing wish for Hamid.',
      imageUrl: '',
      sort_order: 3,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ],
};

function sanitizeSeedImages<T extends { imageUrl?: string }>(items: T[]): T[] {
  return items.map((item) =>
    item.imageUrl && item.imageUrl.startsWith('/seed/') ? { ...item, imageUrl: '' } : item
  );
}

function normalizePageOrder(input?: StepKey[]): StepKey[] {
  if (!Array.isArray(input) || input.length === 0) return [...DEFAULT_PAGE_ORDER];
  const validSet = new Set<StepKey>(DEFAULT_PAGE_ORDER);
  const seen = new Set<StepKey>();
  const cleaned: StepKey[] = [];
  for (const step of input) {
    if (validSet.has(step) && !seen.has(step)) {
      cleaned.push(step);
      seen.add(step);
    }
  }
  for (const step of DEFAULT_PAGE_ORDER) {
    if (!seen.has(step)) cleaned.push(step);
  }
  return cleaned;
}

function ensureStoreFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(SEED_DATA, null, 2), 'utf-8');
  }
}

export function readStore(): AdminDataPayload {
  ensureStoreFile();
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AdminDataPayload>;
    const mergedSettings: AdminSettings = {
      ...SEED_DATA.settings,
      ...(parsed.settings ?? {}),
      visiblePages: {
        ...SEED_DATA.settings.visiblePages,
        ...(parsed.settings?.visiblePages ?? {}),
      },
      pageOrder: normalizePageOrder(parsed.settings?.pageOrder),
      nextButtonLabels: {
        ...SEED_DATA.settings.nextButtonLabels,
        ...(parsed.settings?.nextButtonLabels ?? {}),
      },
    };
    // Migrate the older single welcome video into the new multi-video list
    if (!Array.isArray(mergedSettings.welcomeVideos)) {
      mergedSettings.welcomeVideos = [];
    }
    if (mergedSettings.welcomeVideoUrl && mergedSettings.welcomeVideos.length === 0) {
      mergedSettings.welcomeVideos = [
        {
          id: generateId('vid'),
          url: mergedSettings.welcomeVideoUrl,
          title: mergedSettings.welcomeVideoTitle || '',
          text: mergedSettings.welcomeVideoText || '',
        },
      ];
    }
    mergedSettings.welcomeVideoUrl = '';
    mergedSettings.welcomeVideoTitle = '';
    mergedSettings.welcomeVideoText = '';

    // One-time cleanup of the older default texts (keeps anything the admin customised)
    const OLD_GATE_TITLE = "Before you enter, prove you're my person ❤️";
    const OLD_HINT_1 = 'Enter the 8 digits as Day, Month, Year (DD MM YYYY)';
    const OLD_HINT_2 = 'Springtime in April 2023 — our very first chapter';
    if (mergedSettings.gateTitle === OLD_GATE_TITLE) {
      mergedSettings.gateTitle = SEED_DATA.settings.gateTitle;
    }
    if (
      Array.isArray(mergedSettings.hints) &&
      mergedSettings.hints.length === 2 &&
      mergedSettings.hints[0] === OLD_HINT_1 &&
      mergedSettings.hints[1] === OLD_HINT_2
    ) {
      mergedSettings.hints = [...SEED_DATA.settings.hints];
    }
    if (mergedSettings.extraHintAfterAttempts?.startsWith('Hint: Look back to April 8, 2023')) {
      mergedSettings.extraHintAfterAttempts = '';
    }
    if (
      Array.isArray(mergedSettings.gate2Hints) &&
      mergedSettings.gate2Hints.length === 2 &&
      mergedSettings.gate2Hints[0] === 'Just fifteen days after our very first meetup'
    ) {
      mergedSettings.gate2Hints = [];
    }
    if (mergedSettings.gate2ExtraHint?.startsWith('Hint: April 23, 2023')) {
      mergedSettings.gate2ExtraHint = '';
    }
    if (mergedSettings.finalMediaUrl?.startsWith('/seed/')) {
      mergedSettings.finalMediaUrl = '';
    }

    const rawGallery = Array.isArray(parsed.gallery) ? parsed.gallery : SEED_DATA.gallery;
    const cleanGallery = sanitizeSeedImages(rawGallery).sort(
      (a, b) => a.sort_order - b.sort_order
    );

    return {
      settings: mergedSettings,
      wishes: sanitizeSeedImages(
        Array.isArray(parsed.wishes)
          ? [...parsed.wishes].sort((a, b) => a.sort_order - b.sort_order)
          : SEED_DATA.wishes
      ),
      gallery: cleanGallery,
      promises: Array.isArray(parsed.promises)
        ? [...parsed.promises].sort((a, b) => a.sort_order - b.sort_order)
        : SEED_DATA.promises,
      timeline: sanitizeSeedImages(
        Array.isArray(parsed.timeline)
          ? [...parsed.timeline].sort((a, b) => a.sort_order - b.sort_order)
          : SEED_DATA.timeline
      ),
    };
  } catch (err) {
    console.error('Failed to read store, falling back to seed:', err);
    return structuredClone(SEED_DATA);
  }
}

export function writeStore(data: AdminDataPayload): void {
  ensureStoreFile();
  const tempPath = `${STORE_PATH}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, STORE_PATH);
}

export function toPublicSettings(settings: AdminSettings): PublicSettings {
  const {
    first_meet_date: _g1,
    second_meet_date: _g2,
    ...publicPart
  } = settings;
  return publicPart;
}

export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export type { WishItem, GalleryItem, PromiseItem, TimelineItem };
