import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  ADMIN_COOKIE_NAME,
  PROGRESS_COOKIE_NAME,
  checkLoginRateLimit,
  clearFailedLogins,
  getAdminPassword,
  recordFailedLogin,
  requireAdmin,
  signAdminToken,
  signProgressToken,
  verifyAdminToken,
  verifyProgressToken,
} from './server/auth.ts';
import {
  generateId,
  readStore,
  toPublicSettings,
  writeStore,
  type GalleryItem,
  type PromiseItem,
  type TimelineItem,
  type WishItem,
} from './server/store.ts';

const PORT = Number(process.env.PORT || 3000);
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const safeExt = ext.replace(/[^a-z0-9.]/g, '');
    cb(null, `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error('Unsupported file type. Allowed: JPEG, PNG, WebP, GIF, SVG, MP4, WebM.'));
      return;
    }
    cb(null, true);
  },
});

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '4mb' }));
  app.use(cookieParser());

  // Serve uploaded media cleanly
  app.use('/uploads', express.static(UPLOADS_DIR));

  // ---------- PUBLIC ENDPOINTS ----------
  app.get('/api/public/site', (_req, res) => {
    const store = readStore();
    res.json({
      settings: toPublicSettings(store.settings),
      wishes: store.wishes,
      gallery: store.gallery,
      promises: store.promises,
      timeline: store.timeline,
    });
  });

  app.get('/api/gate/status', (req, res) => {
    const store = readStore();
    const progress = verifyProgressToken(req.cookies?.[PROGRESS_COOKIE_NAME]);
    res.json({
      gate1Passed: !store.settings.gateEnabled || progress.gate1Passed,
      gate2Passed: !store.settings.gate2Enabled || progress.gate2Passed,
    });
  });

  app.post('/api/gate/reset', (_req, res) => {
    res.clearCookie(PROGRESS_COOKIE_NAME, { path: '/' });
    res.json({ ok: true });
  });

  app.post('/api/gate/verify', (req, res) => {
    const { gate = 'gate1', code, attempt = 1 } = req.body || {};
    const isGate2 = gate === 'gate2';

    if (typeof code !== 'string' || !/^\d{8}$/.test(code.trim())) {
      res.status(400).json({ ok: false, message: 'Please enter all 8 digits in DDMMYYYY format.' });
      return;
    }

    const store = readStore();
    const currentProgress = verifyProgressToken(req.cookies?.[PROGRESS_COOKIE_NAME]);

    const enabled = isGate2 ? store.settings.gate2Enabled : store.settings.gateEnabled;
    const expected = isGate2 ? store.settings.second_meet_date : store.settings.first_meet_date;

    if (!enabled || code.trim() === expected.trim()) {
      const nextProgress = {
        gate1Passed: isGate2 ? currentProgress.gate1Passed : true,
        gate2Passed: isGate2 ? true : currentProgress.gate2Passed,
      };
      const progressToken = signProgressToken(nextProgress);
      res.cookie(PROGRESS_COOKIE_NAME, progressToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      const successMessage = isGate2
        ? store.settings.gate2SuccessMessage
        : store.settings.gate1SuccessMessage;

      res.json({ ok: true, message: successMessage });
      return;
    }

    const rawMessages = isGate2 ? store.settings.gate2WrongMessages : store.settings.wrongMessages;
    const messages = rawMessages.length
      ? rawMessages
      : ['Wrong! Go back, you forgot our day 😤'];
    const idx = Math.max(0, Number(attempt) - 1) % messages.length;
    const extraHintText = isGate2
      ? store.settings.gate2ExtraHint
      : store.settings.extraHintAfterAttempts;
    const extraHint = Number(attempt) >= 3 && extraHintText ? extraHintText : undefined;

    res.json({
      ok: false,
      message: messages[idx],
      extraHint,
    });
  });

  // ---------- ADMIN AUTH ----------
  app.get('/api/admin/session', (req, res) => {
    const token = req.cookies?.[ADMIN_COOKIE_NAME];
    res.json({ authenticated: Boolean(token && verifyAdminToken(token)) });
  });

  app.post('/api/admin/login', (req, res) => {
    const ip = req.ip || 'unknown';
    const limit = checkLoginRateLimit(ip);
    if (!limit.allowed) {
      res.status(429).json({
        error: `Too many login attempts. Please try again in ${limit.retryAfterSec} seconds.`,
      });
      return;
    }

    const { password } = req.body || {};
    if (typeof password !== 'string' || password !== getAdminPassword()) {
      recordFailedLogin(ip);
      res.status(401).json({ error: 'Incorrect password. Please try again.' });
      return;
    }

    clearFailedLogins(ip);
    const token = signAdminToken();
    res.cookie(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    res.json({ ok: true });
  });

  app.post('/api/admin/logout', (_req, res) => {
    res.clearCookie(ADMIN_COOKIE_NAME, { path: '/' });
    res.json({ ok: true });
  });

  // ---------- PROTECTED ADMIN ROUTES ----------
  app.get('/api/admin/data', requireAdmin, (_req, res) => {
    const store = readStore();
    res.json(store);
  });

  app.put('/api/admin/settings', requireAdmin, (req, res) => {
    const store = readStore();
    const body = req.body || {};

    if (body.first_meet_date !== undefined && !/^\d{8}$/.test(String(body.first_meet_date).trim())) {
      res.status(400).json({ error: 'Gate 1 date must be exactly 8 digits (DDMMYYYY).' });
      return;
    }
    if (body.second_meet_date !== undefined && !/^\d{8}$/.test(String(body.second_meet_date).trim())) {
      res.status(400).json({ error: 'Gate 2 date must be exactly 8 digits (DDMMYYYY).' });
      return;
    }

    store.settings = {
      ...store.settings,
      ...body,
      first_meet_date: body.first_meet_date
        ? String(body.first_meet_date).trim()
        : store.settings.first_meet_date,
      second_meet_date: body.second_meet_date
        ? String(body.second_meet_date).trim()
        : store.settings.second_meet_date,
      hints: Array.isArray(body.hints)
        ? body.hints.map((h: unknown) => String(h).trim()).filter(Boolean)
        : store.settings.hints,
      wrongMessages: Array.isArray(body.wrongMessages)
        ? body.wrongMessages.map((m: unknown) => String(m).trim()).filter(Boolean)
        : store.settings.wrongMessages,
      gate2Hints: Array.isArray(body.gate2Hints)
        ? body.gate2Hints.map((h: unknown) => String(h).trim()).filter(Boolean)
        : store.settings.gate2Hints,
      welcomeVideos: Array.isArray(body.welcomeVideos)
        ? body.welcomeVideos
            .filter((v: any) => v && typeof v.url === 'string' && v.url.trim())
            .map((v: any) => ({
              id: typeof v.id === 'string' && v.id ? v.id : generateId('vid'),
              url: String(v.url).trim(),
              title: String(v.title ?? '').trim(),
              text: String(v.text ?? '').trim(),
            }))
        : store.settings.welcomeVideos,
      gate2WrongMessages: Array.isArray(body.gate2WrongMessages)
        ? body.gate2WrongMessages.map((m: unknown) => String(m).trim()).filter(Boolean)
        : store.settings.gate2WrongMessages,
    };
    writeStore(store);
    res.json(store.settings);
  });

  // Upload endpoint
  app.post('/api/admin/upload', requireAdmin, (req, res) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err.message || 'Upload failed' });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: 'No file provided.' });
        return;
      }
      const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
      res.json({ url: `/uploads/${req.file.filename}`, mediaType });
    });
  });

  // Wishes CRUD + reorder
  app.post('/api/admin/wishes', requireAdmin, (req, res) => {
    const store = readStore();
    const { title, text, imageUrl } = req.body || {};
    if (!text || !String(text).trim()) {
      res.status(400).json({ error: 'Wish text is required.' });
      return;
    }
    const maxOrder = store.wishes.reduce((m, w) => Math.max(m, w.sort_order), 0);
    const created: WishItem = {
      id: generateId('wish'),
      title: String(title || 'A Birthday Wish').trim(),
      text: String(text).trim(),
      imageUrl: String(imageUrl || '').trim(),
      sort_order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    };
    store.wishes.push(created);
    writeStore(store);
    res.status(201).json(created);
  });

  app.put('/api/admin/wishes/:id', requireAdmin, (req, res) => {
    const store = readStore();
    const idx = store.wishes.findIndex((w) => w.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Wish not found.' });
      return;
    }
    store.wishes[idx] = { ...store.wishes[idx], ...req.body, id: store.wishes[idx].id };
    writeStore(store);
    res.json(store.wishes[idx]);
  });

  app.post('/api/admin/wishes/reorder', requireAdmin, (req, res) => {
    const store = readStore();
    const orderedIds: string[] = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds : [];
    const map = new Map(store.wishes.map((w) => [w.id, w]));
    const next: WishItem[] = [];
    orderedIds.forEach((id, i) => {
      const item = map.get(id);
      if (item) {
        next.push({ ...item, sort_order: i + 1 });
        map.delete(id);
      }
    });
    for (const remaining of map.values()) {
      next.push({ ...remaining, sort_order: next.length + 1 });
    }
    store.wishes = next;
    writeStore(store);
    res.json(store.wishes);
  });

  app.delete('/api/admin/wishes/:id', requireAdmin, (req, res) => {
    const store = readStore();
    store.wishes = store.wishes.filter((w) => w.id !== req.params.id);
    writeStore(store);
    res.json({ ok: true });
  });

  // Gallery CRUD + reorder
  app.post('/api/admin/gallery', requireAdmin, (req, res) => {
    const store = readStore();
    const { imageUrl, caption, album, capturedDate } = req.body || {};
    if (!imageUrl || !String(imageUrl).trim()) {
      res.status(400).json({ error: 'Image URL is required.' });
      return;
    }
    const maxOrder = store.gallery.reduce((m, g) => Math.max(m, g.sort_order), 0);
    const created: GalleryItem = {
      id: generateId('gal'),
      imageUrl: String(imageUrl).trim(),
      caption: String(caption || 'Cherished moment').trim(),
      album: String(album || 'Memories').trim(),
      capturedDate: String(capturedDate || '').trim(),
      sort_order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    };
    store.gallery.push(created);
    writeStore(store);
    res.status(201).json(created);
  });

  app.put('/api/admin/gallery/:id', requireAdmin, (req, res) => {
    const store = readStore();
    const idx = store.gallery.findIndex((g) => g.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Photo not found.' });
      return;
    }
    store.gallery[idx] = { ...store.gallery[idx], ...req.body, id: store.gallery[idx].id };
    writeStore(store);
    res.json(store.gallery[idx]);
  });

  app.post('/api/admin/gallery/reorder', requireAdmin, (req, res) => {
    const store = readStore();
    const orderedIds: string[] = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds : [];
    const map = new Map(store.gallery.map((g) => [g.id, g]));
    const next: GalleryItem[] = [];
    orderedIds.forEach((id, i) => {
      const item = map.get(id);
      if (item) {
        next.push({ ...item, sort_order: i + 1 });
        map.delete(id);
      }
    });
    for (const remaining of map.values()) {
      next.push({ ...remaining, sort_order: next.length + 1 });
    }
    store.gallery = next;
    writeStore(store);
    res.json(store.gallery);
  });

  app.delete('/api/admin/gallery/:id', requireAdmin, (req, res) => {
    const store = readStore();
    store.gallery = store.gallery.filter((g) => g.id !== req.params.id);
    writeStore(store);
    res.json({ ok: true });
  });

  // Promises CRUD + reorder
  app.post('/api/admin/promises', requireAdmin, (req, res) => {
    const store = readStore();
    const { icon, title, text } = req.body || {};
    if (!text || !String(text).trim()) {
      res.status(400).json({ error: 'Promise text is required.' });
      return;
    }
    const maxOrder = store.promises.reduce((m, p) => Math.max(m, p.sort_order), 0);
    const created: PromiseItem = {
      id: generateId('pr'),
      icon: String(icon || '❤️').trim(),
      title: String(title || 'My Promise').trim(),
      text: String(text).trim(),
      sort_order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    };
    store.promises.push(created);
    writeStore(store);
    res.status(201).json(created);
  });

  app.put('/api/admin/promises/:id', requireAdmin, (req, res) => {
    const store = readStore();
    const idx = store.promises.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Promise not found.' });
      return;
    }
    store.promises[idx] = { ...store.promises[idx], ...req.body, id: store.promises[idx].id };
    writeStore(store);
    res.json(store.promises[idx]);
  });

  app.post('/api/admin/promises/reorder', requireAdmin, (req, res) => {
    const store = readStore();
    const orderedIds: string[] = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds : [];
    const map = new Map(store.promises.map((p) => [p.id, p]));
    const next: PromiseItem[] = [];
    orderedIds.forEach((id, i) => {
      const item = map.get(id);
      if (item) {
        next.push({ ...item, sort_order: i + 1 });
        map.delete(id);
      }
    });
    for (const remaining of map.values()) {
      next.push({ ...remaining, sort_order: next.length + 1 });
    }
    store.promises = next;
    writeStore(store);
    res.json(store.promises);
  });

  app.delete('/api/admin/promises/:id', requireAdmin, (req, res) => {
    const store = readStore();
    store.promises = store.promises.filter((p) => p.id !== req.params.id);
    writeStore(store);
    res.json({ ok: true });
  });

  // Timeline CRUD + reorder
  app.post('/api/admin/timeline', requireAdmin, (req, res) => {
    const store = readStore();
    const { dateLabel, title, description, imageUrl, isFirstMeeting } = req.body || {};
    if (!title || !String(title).trim()) {
      res.status(400).json({ error: 'Milestone title is required.' });
      return;
    }
    const maxOrder = store.timeline.reduce((m, t) => Math.max(m, t.sort_order), 0);
    const created: TimelineItem = {
      id: generateId('tl'),
      dateLabel: String(dateLabel || '').trim(),
      title: String(title).trim(),
      description: String(description || '').trim(),
      imageUrl: String(imageUrl || '').trim(),
      isFirstMeeting: Boolean(isFirstMeeting),
      sort_order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    };
    store.timeline.push(created);
    writeStore(store);
    res.status(201).json(created);
  });

  app.put('/api/admin/timeline/:id', requireAdmin, (req, res) => {
    const store = readStore();
    const idx = store.timeline.findIndex((t) => t.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Milestone not found.' });
      return;
    }
    store.timeline[idx] = { ...store.timeline[idx], ...req.body, id: store.timeline[idx].id };
    writeStore(store);
    res.json(store.timeline[idx]);
  });

  app.post('/api/admin/timeline/reorder', requireAdmin, (req, res) => {
    const store = readStore();
    const orderedIds: string[] = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds : [];
    const map = new Map(store.timeline.map((t) => [t.id, t]));
    const next: TimelineItem[] = [];
    orderedIds.forEach((id, i) => {
      const item = map.get(id);
      if (item) {
        next.push({ ...item, sort_order: i + 1 });
        map.delete(id);
      }
    });
    for (const remaining of map.values()) {
      next.push({ ...remaining, sort_order: next.length + 1 });
    }
    store.timeline = next;
    writeStore(store);
    res.json(store.timeline);
  });

  app.delete('/api/admin/timeline/:id', requireAdmin, (req, res) => {
    const store = readStore();
    store.timeline = store.timeline.filter((t) => t.id !== req.params.id);
    writeStore(store);
    res.json({ ok: true });
  });

  // ---------- VITE / STATIC SPA FALLBACK ----------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  console.log(
    process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim()
      ? `[env] ADMIN_PASSWORD loaded from .env (${process.env.ADMIN_PASSWORD.trim().length} characters)`
      : '[env] ADMIN_PASSWORD NOT found in .env — using default password: love2026'
  );
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
