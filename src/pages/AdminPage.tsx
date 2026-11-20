import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookHeart,
  Check,
  ExternalLink,
  Gift,
  HeartHandshake,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type {
  AdminDataPayload,
  AdminSettings,
  GalleryItem,
  PromiseItem,
  StepKey,
  ThemeAccent,
  TimelineItem,
  WishItem,
} from '../types/app';
import { AdminLogin } from '../components/admin/AdminLogin';
import { ConfirmModal } from '../components/admin/ConfirmModal';
import { BearCouple } from '../components/BearCouple';
import { getThemePalette } from '../utils/theme';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { THEME_PALTES_LIST } from '../utils/themeHelpers';

type AdminTab =
  | 'overview'
  | 'settings'
  | 'wishes'
  | 'gallery'
  | 'promises'
  | 'timeline'
  | 'letter';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface AdminPageProps {
  onBackHome: () => void;
  onDataUpdated: () => void;
}

const SIDEBAR_ITEMS: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'wishes', label: 'Wishes', icon: Sparkles },
  { id: 'gallery', label: 'Gallery', icon: Images },
  { id: 'promises', label: 'Promises', icon: HeartHandshake },
  { id: 'timeline', label: 'Timeline', icon: BookHeart },
  { id: 'letter', label: 'Final Letter', icon: Gift },
];

export function AdminPage({ onBackHome, onDataUpdated }: AdminPageProps) {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [data, setData] = useState<AdminDataPayload | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);

  // Settings & Letter drafts
  const [settingsDraft, setSettingsDraft] = useState<AdminSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Confirm delete modal
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: 'wishes' | 'gallery' | 'promises' | 'timeline';
    id: string;
    label: string;
  } | null>(null);

  // Inline create/edit state
  const [newWish, setNewWish] = useState({ title: '', text: '', imageUrl: '' });
  const [editingWish, setEditingWish] = useState<WishItem | null>(null);

  const [newPromise, setNewPromise] = useState({ icon: '❤️', title: '', text: '' });
  const [editingPromise, setEditingPromise] = useState<PromiseItem | null>(null);

  const [newMilestone, setNewMilestone] = useState({
    dateLabel: '',
    title: '',
    description: '',
    imageUrl: '',
    isFirstMeeting: false,
  });
  const [editingMilestone, setEditingMilestone] = useState<TimelineItem | null>(null);

  const [galleryAlbumInput, setGalleryAlbumInput] = useState('Memories');
  const [galleryCaptionInput, setGalleryCaptionInput] = useState('');
  const [galleryDateInput, setGalleryDateInput] = useState('');
  const [editingPhoto, setEditingPhoto] = useState<GalleryItem | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const galleryFileRef = useRef<HTMLInputElement | null>(null);

  const pushToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/data');
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to load admin data');
      const payload = (await res.json()) as AdminDataPayload;
      setData(payload);
      setSettingsDraft(payload.settings);
    } catch {
      pushToast('Failed to load studio data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    fetch('/api/admin/session')
      .then((r) => r.json())
      .then((s) => {
        setAuthenticated(Boolean(s.authenticated));
        setAuthChecked(true);
        if (s.authenticated) {
          loadAdminData();
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        setAuthChecked(true);
        setLoading(false);
      });
  }, [loadAdminData]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthenticated(false);
    setData(null);
  };

  const compressImageIfNeeded = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
      return file;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const maxDim = 1600;
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      if (scale === 1 && file.size < 450 * 1024) {
        bitmap.close();
        return file;
      }
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        bitmap.close();
        return file;
      }
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', 0.85)
      );
      if (!blob) return file;
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
    } catch {
      return file;
    }
  };

  const uploadSingleFile = async (file: File): Promise<{ url: string; mediaType: 'image' | 'video' } | null> => {
    const prepared = await compressImageIfNeeded(file);
    const form = new FormData();
    form.append('file', prepared);
    setUploading(true);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) {
        pushToast(json.error || 'Upload failed', 'error');
        return null;
      }
      return { url: json.url, mediaType: json.mediaType || 'image' };
    } catch {
      pushToast('Upload failed.', 'error');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const saveSettings = async (nextSettings: AdminSettings, successMessage = 'Settings saved.') => {
    const d1 = (nextSettings.first_meet_date || '').trim();
    const d2 = (nextSettings.second_meet_date || '').trim();
    if (!/^\d{8}$/.test(d1)) {
      pushToast('Gate 1 date must be exactly 8 digits in DDMMYYYY format (e.g. 08042023).', 'error');
      return;
    }
    if (!/^\d{8}$/.test(d2)) {
      pushToast('Gate 2 date must be exactly 8 digits in DDMMYYYY format (e.g. 23042023).', 'error');
      return;
    }

    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nextSettings,
          first_meet_date: d1,
          second_meet_date: d2,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        pushToast(json.error || 'Could not save settings.', 'error');
        return;
      }
      const saved = json as AdminSettings;
      setSettingsDraft(saved);
      setData((prev) => (prev ? { ...prev, settings: saved } : prev));
      onDataUpdated();
      pushToast(successMessage);
    } catch {
      pushToast('Could not save settings.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleReorder = async (
    kind: 'wishes' | 'gallery' | 'promises' | 'timeline',
    index: number,
    direction: -1 | 1
  ) => {
    if (!data) return;
    const list = [...data[kind]];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    [list[index], list[targetIdx]] = [list[targetIdx], list[index]];
    const orderedIds = list.map((item) => item.id);

    try {
      const res = await fetch(`/api/admin/${kind}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error('Reorder failed');
      const updated = await res.json();
      setData((prev) => (prev ? { ...prev, [kind]: updated } : prev));
      onDataUpdated();
      pushToast('Order updated.');
    } catch {
      pushToast('Could not reorder items.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { kind, id } = deleteTarget;
    try {
      const res = await fetch(`/api/admin/${kind}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setData((prev) =>
        prev ? { ...prev, [kind]: prev[kind].filter((item) => item.id !== id) } : prev
      );
      onDataUpdated();
      pushToast('Deleted successfully.');
    } catch {
      pushToast('Delete failed.', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  // Multi-image upload handler for Gallery
  const handleGalleryFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      const uploaded = await uploadSingleFile(file);
      if (uploaded) {
        const res = await fetch('/api/admin/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: uploaded.url,
            caption: galleryCaptionInput.trim() || file.name.replace(/\.[^/.]+$/, ''),
            album: galleryAlbumInput.trim() || 'Memories',
            capturedDate: galleryDateInput.trim(),
          }),
        });
        if (res.ok) {
          const created = (await res.json()) as GalleryItem;
          setData((prev) => (prev ? { ...prev, gallery: [...prev.gallery, created] } : prev));
        }
      }
    }
    setGalleryCaptionInput('');
    onDataUpdated();
    pushToast('Photo(s) added to gallery.');
  };

  const onDropGallery = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    handleGalleryFiles(e.dataTransfer.files);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0d0a10] flex items-center justify-center text-sm text-[#faf6f0]/60">
        Checking session...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <AdminLogin
        onSuccess={() => {
          setAuthenticated(true);
          loadAdminData();
        }}
        onBackHome={onBackHome}
      />
    );
  }

  const currentTabLabel = SIDEBAR_ITEMS.find((i) => i.id === activeTab)?.label || 'Overview';

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#f5f3ef] flex relative z-10">
      {/* Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-xs w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs font-medium shadow-xl border ${
              t.type === 'error'
                ? 'bg-rose-950/95 border-rose-500/40 text-rose-100'
                : 'bg-[#191d28]/95 border-[#d9b37c]/35 text-[#faf6f0]'
            }`}
          >
            <span className="flex items-center gap-2">
              {t.type === 'success' && <Check className="w-3.5 h-3.5 text-[#d9b37c]" />}
              {t.message}
            </span>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="opacity-60 hover:opacity-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.label || 'item'}?`}
        description="This action permanently removes the item from your birthday website."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-white/10 bg-[#131620]">
        <div className="h-16 px-6 flex items-center border-b border-white/10">
          <span className="font-semibold text-sm tracking-tight text-[#faf6f0]">
            Birthday Studio
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#e28794]/15 text-[#faf6f0] border border-[#e28794]/30'
                    : 'text-[#faf6f0]/65 hover:text-[#faf6f0] hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" style={active ? { color: '#e28794' } : undefined} />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <button
            type="button"
            onClick={onBackHome}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-[#faf6f0]/70 hover:text-[#faf6f0] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Public Site</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-rose-300/80 hover:text-rose-200 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-[#131620] border-r border-white/10 flex flex-col z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
              <span className="font-semibold text-sm">Birthday Studio</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-[#faf6f0]/70 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                      active
                        ? 'bg-[#e28794]/15 text-[#faf6f0] border border-[#e28794]/30'
                        : 'text-[#faf6f0]/65'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-3 border-t border-white/10 space-y-1">
              <button
                type="button"
                onClick={onBackHome}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-[#faf6f0]/75"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Public Site</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-rose-300"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 px-4 sm:px-8 border-b border-white/10 bg-[#131620]/70 backdrop-blur-md flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-[#faf6f0]/80 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm text-[#faf6f0]/60 truncate">
              <span>Admin Studio</span>
              <span className="mx-2 text-[#faf6f0]/30">/</span>
              <span className="text-[#faf6f0] font-medium">{currentTabLabel}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-[#faf6f0] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Preview Site</span>
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">
          {loading || !data || !settingsDraft ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-28 rounded-2xl bg-[#161922] border border-white/10 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-semibold text-[#faf6f0]">
                        Welcome back, {data.settings.coupleNames}
                      </h1>
                      <p className="text-sm text-[#faf6f0]/65 mt-1">
                        Every edit you save here updates the live birthday website immediately.
                      </p>
                    </div>
                    <div className="h-28 w-44 shrink-0">
                      <BearCouple mood="idle" palette={getThemePalette(data.settings.themeAccent)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Gallery Photos', value: data.gallery.length, tab: 'gallery' as AdminTab },
                      { label: 'Birthday Wishes', value: data.wishes.length, tab: 'wishes' as AdminTab },
                      { label: 'Promises', value: data.promises.length, tab: 'promises' as AdminTab },
                      { label: 'Timeline Milestones', value: data.timeline.length, tab: 'timeline' as AdminTab },
                    ].map((stat) => (
                      <button
                        key={stat.label}
                        type="button"
                        onClick={() => setActiveTab(stat.tab)}
                        className="text-left p-5 rounded-2xl bg-[#161922] border border-white/10 hover:border-[#d9b37c]/40 transition-colors cursor-pointer"
                      >
                        <p className="text-xs text-[#faf6f0]/60">{stat.label}</p>
                        <p className="font-mono-tabular text-3xl font-semibold text-[#faf6f0] mt-2">
                          {stat.value}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-2xl bg-[#161922] border border-white/10 p-6 space-y-3">
                      <h2 className="text-base font-semibold">Memory Gates Configuration</h2>
                      <div className="text-xs text-[#faf6f0]/65 leading-relaxed space-y-1.5">
                        <p>
                          Gate 1 (First Meetup):{' '}
                          <strong className="text-[#d9b37c]">
                            {data.settings.gateEnabled ? 'Enabled' : 'Disabled'}
                          </strong>{' '}
                          — Answer:{' '}
                          <span className="font-mono-tabular text-[#faf6f0]">
                            {data.settings.first_meet_date}
                          </span>
                        </p>
                        <p>
                          Gate 2 (Second Meetup):{' '}
                          <strong className="text-[#d9b37c]">
                            {data.settings.gate2Enabled ? 'Enabled' : 'Disabled'}
                          </strong>{' '}
                          — Answer:{' '}
                          <span className="font-mono-tabular text-[#faf6f0]">
                            {data.settings.second_meet_date}
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveTab('settings')}
                          className="px-4 py-2 rounded-lg text-xs font-medium bg-[#e28794] text-[#120c14] cursor-pointer"
                        >
                          Edit Gates &amp; Site Settings
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            localStorage.removeItem('birthday_progress_v3');
                            localStorage.removeItem('birthday_gate_unlocked_v1');
                            localStorage.removeItem('birthday_max_step_v2');
                            try {
                              await fetch('/api/gate/reset', { method: 'POST' });
                            } catch {
                              // ignore network issue
                            }
                            pushToast('Visitor progress reset. Public site starts from Gate 1.');
                          }}
                          className="px-4 py-2 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-[#faf6f0] cursor-pointer"
                        >
                          Reset Visitor Progress
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#161922] border border-white/10 p-6 space-y-3">
                      <h2 className="text-base font-semibold">Final Love Letter Preview</h2>
                      <p className="text-xs text-[#faf6f0]/65 line-clamp-3 leading-relaxed">
                        {data.settings.finalLetter}
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('letter')}
                        className="px-4 py-2 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-[#faf6f0] cursor-pointer"
                      >
                        Edit Final Surprise
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === 'settings' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveSettings(settingsDraft);
                  }}
                  className="space-y-6 max-w-3xl"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h1 className="text-xl font-semibold">Site &amp; Gate Settings</h1>
                      <p className="text-xs text-[#faf6f0]/60 mt-0.5">
                        Configure names, Gate 1 &amp; Gate 2 dates (DDMMYYYY), page order, music, and theme accent.
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="px-5 py-2.5 rounded-xl bg-[#e28794] text-[#120c14] text-xs font-semibold cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
                    >
                      {savingSettings ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>

                  {/* General Couple & Theme */}
                  <div className="rounded-2xl bg-[#161922] border border-white/10 p-6 space-y-5">
                    <h2 className="text-sm font-semibold text-[#d9b37c]">Couple &amp; Theme</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-[#faf6f0]/70 mb-1.5">Husband&apos;s Name</label>
                        <input
                          type="text"
                          value={settingsDraft.husbandName}
                          onChange={(e) =>
                            setSettingsDraft({ ...settingsDraft, husbandName: e.target.value })
                          }
                          className="w-full h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#faf6f0]/70 mb-1.5">Wife&apos;s Name</label>
                        <input
                          type="text"
                          value={settingsDraft.wifeName}
                          onChange={(e) =>
                            setSettingsDraft({ ...settingsDraft, wifeName: e.target.value })
                          }
                          className="w-full h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#faf6f0]/70 mb-1.5">Couple Display Name</label>
                        <input
                          type="text"
                          value={settingsDraft.coupleNames}
                          onChange={(e) =>
                            setSettingsDraft({ ...settingsDraft, coupleNames: e.target.value })
                          }
                          className="w-full h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-[#faf6f0]/70 mb-1.5">Hero Romantic Intro</label>
                      <textarea
                        rows={2}
                        value={settingsDraft.heroIntro}
                        onChange={(e) =>
                          setSettingsDraft({ ...settingsDraft, heroIntro: e.target.value })
                        }
                        className="w-full p-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                      />
                    </div>

                    <div className="space-y-4 p-4 rounded-2xl bg-[#0f1117] border border-white/10">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="block text-sm font-medium text-[#faf6f0]">
                          Welcome Page Videos ({(settingsDraft.welcomeVideos || []).length})
                        </label>
                        <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploading ? 'Uploading...' : 'Add Videos (select many)'}</span>
                          <input
                            type="file"
                            accept="video/mp4,video/webm"
                            multiple
                            className="hidden"
                            onChange={async (e) => {
                              const files = Array.from(e.target.files || []);
                              e.target.value = '';
                              if (files.length === 0) return;
                              const added: { id: string; url: string; title: string; text: string }[] = [];
                              for (const file of files) {
                                const uploaded = await uploadSingleFile(file);
                                if (uploaded) {
                                  added.push({
                                    id: `vid-${Date.now()}-${added.length}`,
                                    url: uploaded.url,
                                    title: '',
                                    text: '',
                                  });
                                }
                              }
                              if (added.length > 0) {
                                setSettingsDraft((prev) =>
                                  prev
                                    ? { ...prev, welcomeVideos: [...(prev.welcomeVideos || []), ...added] }
                                    : prev
                                );
                                pushToast(`${added.length} video(s) added. Press Save to publish.`, 'success');
                              }
                            }}
                          />
                        </label>
                      </div>

                      {(settingsDraft.welcomeVideos || []).length === 0 && (
                        <p className="text-xs text-[#faf6f0]/55">
                          No videos yet. Add one or many MP4 / WebM videos, then write a heading and text for each.
                        </p>
                      )}

                      {(settingsDraft.welcomeVideos || []).map((vid, idx, arr) => {
                        const update = (patch: Partial<typeof vid>) =>
                          setSettingsDraft({
                            ...settingsDraft,
                            welcomeVideos: arr.map((x) => (x.id === vid.id ? { ...x, ...patch } : x)),
                          });
                        const move = (dir: -1 | 1) => {
                          const next = [...arr];
                          const j = idx + dir;
                          if (j < 0 || j >= next.length) return;
                          [next[idx], next[j]] = [next[j], next[idx]];
                          setSettingsDraft({ ...settingsDraft, welcomeVideos: next });
                        };
                        return (
                          <div
                            key={vid.id}
                            className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3 p-3 rounded-xl bg-[#161922] border border-white/10"
                          >
                            <video
                              src={vid.url}
                              controls
                              preload="metadata"
                              className="w-full max-h-48 rounded-lg bg-black object-contain"
                            />
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-[#d9b37c]">Video {idx + 1}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => move(-1)}
                                    disabled={idx === 0}
                                    className="w-7 h-7 flex items-center justify-center rounded-md bg-white/10 disabled:opacity-30 cursor-pointer"
                                    aria-label="Move video up"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => move(1)}
                                    disabled={idx === arr.length - 1}
                                    className="w-7 h-7 flex items-center justify-center rounded-md bg-white/10 disabled:opacity-30 cursor-pointer"
                                    aria-label="Move video down"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSettingsDraft({
                                        ...settingsDraft,
                                        welcomeVideos: arr.filter((x) => x.id !== vid.id),
                                      })
                                    }
                                    className="w-7 h-7 flex items-center justify-center rounded-md bg-rose-500/20 text-rose-300 cursor-pointer"
                                    aria-label="Remove video"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <input
                                type="text"
                                placeholder="Heading for this video"
                                value={vid.title}
                                onChange={(e) => update({ title: e.target.value })}
                                className="w-full h-9 px-3 rounded-lg bg-[#0f1117] border border-white/10 text-sm"
                              />
                              <textarea
                                rows={2}
                                placeholder="Text written about this video"
                                value={vid.text}
                                onChange={(e) => update({ text: e.target.value })}
                                className="w-full p-2.5 rounded-lg bg-[#0f1117] border border-white/10 text-sm"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[#faf6f0]/70 mb-1.5">
                          Together Since (Counter Start)
                        </label>
                        <input
                          type="datetime-local"
                          value={settingsDraft.togetherSinceDate.slice(0, 16)}
                          onChange={(e) =>
                            setSettingsDraft({ ...settingsDraft, togetherSinceDate: e.target.value })
                          }
                          className="w-full h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-[#faf6f0]/70 mb-1.5">
                          Background Music MP3 URL (optional)
                        </label>
                        <input
                          type="url"
                          placeholder="Leave blank for built-in gentle music box"
                          value={settingsDraft.musicUrl}
                          onChange={(e) =>
                            setSettingsDraft({ ...settingsDraft, musicUrl: e.target.value })
                          }
                          className="w-full h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-[#faf6f0]/70 mb-1.5">
                        Theme Accent Color
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {THEME_PALTES_LIST.map((opt) => {
                          const selected = settingsDraft.themeAccent === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() =>
                                setSettingsDraft({
                                  ...settingsDraft,
                                  themeAccent: opt.id as ThemeAccent,
                                })
                              }
                              className={`h-10 px-3 rounded-xl border text-xs font-medium flex items-center gap-2 cursor-pointer ${
                                selected
                                  ? 'border-[#faf6f0] bg-white/10'
                                  : 'border-white/10 bg-[#0f1117]'
                              }`}
                            >
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: opt.color }}
                              />
                              <span className="truncate">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* GATE 1 (FIRST MEETUP) */}
                  <div className="rounded-2xl bg-[#161922] border border-white/10 p-6 space-y-5">
                    <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/10">
                      <div>
                        <h2 className="text-sm font-semibold text-[#e28794]">Gate 1 — First Meetup</h2>
                        <p className="text-xs text-[#faf6f0]/55 mt-0.5">
                          Locked entrance before Welcome. Verified server-side using 8 digits (DDMMYYYY).
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                        <span>{settingsDraft.gateEnabled ? 'Enabled' : 'Disabled'}</span>
                        <input
                          type="checkbox"
                          checked={settingsDraft.gateEnabled}
                          onChange={(e) =>
                            setSettingsDraft({ ...settingsDraft, gateEnabled: e.target.checked })
                          }
                          className="w-5 h-5 accent-[#e28794] cursor-pointer"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-[#faf6f0]/70 mb-1.5">
                          First Meet Date (DDMMYYYY)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={8}
                          placeholder="08042023"
                          value={settingsDraft.first_meet_date}
                          onChange={(e) =>
                            setSettingsDraft({
                              ...settingsDraft,
                              first_meet_date: e.target.value.replace(/\D/g, '').slice(0, 8),
                            })
                          }
                          className="w-full h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm font-mono-tabular tracking-widest"
                        />
                        <p className="text-[10px] text-[#faf6f0]/45 mt-1">
                          8 digits only, e.g. 08042023
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-[#faf6f0]/70 mb-1.5">Gate 1 Heading</label>
                        <input
                          type="text"
                          value={settingsDraft.gateTitle}
                          onChange={(e) =>
                            setSettingsDraft({ ...settingsDraft, gateTitle: e.target.value })
                          }
                          className="w-full h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#faf6f0]/70 mb-1.5">Gate 1 Question</label>
                        <input
                          type="text"
                          value={settingsDraft.gateQuestion}
                          onChange={(e) =>
                            setSettingsDraft({ ...settingsDraft, gateQuestion: e.target.value })
                          }
                          className="w-full h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                        />
                      </div>
                    </div>

                    {/* Gate 1 Hints */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-[#faf6f0]/70">Gate 1 Hints</label>
                        <button
                          type="button"
                          onClick={() =>
                            setSettingsDraft({
                              ...settingsDraft,
                              hints: [...settingsDraft.hints, 'New clue...'],
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs text-[#d9b37c] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Hint
                        </button>
                      </div>
                      {settingsDraft.hints.map((hint, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={hint}
                            onChange={(e) => {
                              const next = [...settingsDraft.hints];
                              next[idx] = e.target.value;
                              setSettingsDraft({ ...settingsDraft, hints: next });
                            }}
                            className="flex-1 h-9 px-3 rounded-lg bg-[#0f1117] border border-white/10 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsDraft({
                                ...settingsDraft,
                                hints: settingsDraft.hints.filter((_, i) => i !== idx),
                              })
                            }
                            className="px-2.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Gate 1 Wrong Messages */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-[#faf6f0]/70">
                          Gate 1 Wrong-Answer Messages (Bears React)
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setSettingsDraft({
                              ...settingsDraft,
                              wrongMessages: [...settingsDraft.wrongMessages, 'Try again 🥺'],
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs text-[#d9b37c] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Message
                        </button>
                      </div>
                      {settingsDraft.wrongMessages.map((msg, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={msg}
                            onChange={(e) => {
                              const next = [...settingsDraft.wrongMessages];
                              next[idx] = e.target.value;
                              setSettingsDraft({ ...settingsDraft, wrongMessages: next });
                            }}
                            className="flex-1 h-9 px-3 rounded-lg bg-[#0f1117] border border-white/10 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsDraft({
                                ...settingsDraft,
                                wrongMessages: settingsDraft.wrongMessages.filter((_, i) => i !== idx),
                              })
                            }
                            className="px-2.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[#faf6f0]/70 mb-1.5">
                          Gate 1 Extra Rescue Hint (3+ wrong attempts)
                        </label>
                        <input
                          type="text"
                          value={settingsDraft.extraHintAfterAttempts}
                          onChange={(e) =>
                            setSettingsDraft({
                              ...settingsDraft,
                              extraHintAfterAttempts: e.target.value,
                            })
                          }
                          className="w-full h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#faf6f0]/70 mb-1.5">
                          Gate 1 Success Message
                        </label>
                        <input
                          type="text"
                          value={settingsDraft.gate1SuccessMessage}
                          onChange={(e) =>
                            setSettingsDraft({
                              ...settingsDraft,
                              gate1SuccessMessage: e.target.value,
                            })
                          }
                          className="w-full h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GATE 2 (SECOND / OFFICIAL MEETUP) */}
                  <div className="rounded-2xl bg-[#161922] border border-white/10 p-6 space-y-5">
                    <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/10">
                      <div>
                        <h2 className="text-sm font-semibold text-[#d9b37c]">
                          Gate 2 — Second / Official Meetup
                        </h2>
                        <p className="text-xs text-[#faf6f0]/55 mt-0.5">
                          Mid-journey checkpoint after Promises. Verified server-side using 8 digits (DDMMYYYY).
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                        <span>{settingsDraft.gate2Enabled ? 'Enabled' : 'Disabled'}</span>
                        <input
                          type="checkbox"
                          checked={settingsDraft.gate2Enabled}
                          onChange={(e) =>
                            setSettingsDraft({
                              ...settingsDraft,
                              gate2Enabled: e.target.checked,
                              visiblePages: {
                                ...settingsDraft.visiblePages,
                                gate2: e.target.checked,
                              },
                            })
                          }
                          className="w-5 h-5 accent-[#d9b37c] cursor-pointer"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-[#faf6f0]/70 mb-1.5">
                          Second Meet Date (DDMMYYYY)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={8}
                          placeholder="23042023"
                          value={settingsDraft.second_meet_date}
                          onChange={(e) =>
                            setSettingsDraft({
                              ...settingsDraft,
                              second_meet_date: e.target.value.replace(/\D/g, '').slice(0, 8),
                            })
                          }
                          className="w-full h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm font-mono-tabular tracking-widest"
                        />
                        <p className="text-[10px] text-[#faf6f0]/45 mt-1">
                          8 digits only, e.g. 23042023
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-[#faf6f0]/70 mb-1.5">Gate 2 Heading</label>
                        <input
                          type="text"
                          value={settingsDraft.gate2Title}
                          onChange={(e) =>
                            setSettingsDraft({ ...settingsDraft, gate2Title: e.target.value })
                          }
                          className="w-full h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#faf6f0]/70 mb-1.5">Gate 2 Question</label>
                        <input
                          type="text"
                          value={settingsDraft.gate2Question}
                          onChange={(e) =>
                            setSettingsDraft({ ...settingsDraft, gate2Question: e.target.value })
                          }
                          className="w-full h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                        />
                      </div>
                    </div>

                    {/* Gate 2 Hints */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-[#faf6f0]/70">Gate 2 Hints</label>
                        <button
                          type="button"
                          onClick={() =>
                            setSettingsDraft({
                              ...settingsDraft,
                              gate2Hints: [...settingsDraft.gate2Hints, 'New clue...'],
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs text-[#d9b37c] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Hint
                        </button>
                      </div>
                      {settingsDraft.gate2Hints.map((hint, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={hint}
                            onChange={(e) => {
                              const next = [...settingsDraft.gate2Hints];
                              next[idx] = e.target.value;
                              setSettingsDraft({ ...settingsDraft, gate2Hints: next });
                            }}
                            className="flex-1 h-9 px-3 rounded-lg bg-[#0f1117] border border-white/10 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsDraft({
                                ...settingsDraft,
                                gate2Hints: settingsDraft.gate2Hints.filter((_, i) => i !== idx),
                              })
                            }
                            className="px-2.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Gate 2 Wrong Messages */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-[#faf6f0]/70">
                          Gate 2 Wrong-Answer Messages (Bears React)
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setSettingsDraft({
                              ...settingsDraft,
                              gate2WrongMessages: [...settingsDraft.gate2WrongMessages, 'Think of April 🥺'],
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs text-[#d9b37c] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Message
                        </button>
                      </div>
                      {settingsDraft.gate2WrongMessages.map((msg, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={msg}
                            onChange={(e) => {
                              const next = [...settingsDraft.gate2WrongMessages];
                              next[idx] = e.target.value;
                              setSettingsDraft({ ...settingsDraft, gate2WrongMessages: next });
                            }}
                            className="flex-1 h-9 px-3 rounded-lg bg-[#0f1117] border border-white/10 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsDraft({
                                ...settingsDraft,
                                gate2WrongMessages: settingsDraft.gate2WrongMessages.filter((_, i) => i !== idx),
                              })
                            }
                            className="px-2.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[#faf6f0]/70 mb-1.5">
                          Gate 2 Extra Rescue Hint (3+ wrong attempts)
                        </label>
                        <input
                          type="text"
                          value={settingsDraft.gate2ExtraHint}
                          onChange={(e) =>
                            setSettingsDraft({
                              ...settingsDraft,
                              gate2ExtraHint: e.target.value,
                            })
                          }
                          className="w-full h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#faf6f0]/70 mb-1.5">
                          Gate 2 Success Message
                        </label>
                        <input
                          type="text"
                          value={settingsDraft.gate2SuccessMessage}
                          onChange={(e) =>
                            setSettingsDraft({
                              ...settingsDraft,
                              gate2SuccessMessage: e.target.value,
                            })
                          }
                          className="w-full h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PAGE ORDER & VISIBILITY + NEXT LABELS */}
                  <div className="rounded-2xl bg-[#161922] border border-white/10 p-6 space-y-5">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-[#faf6f0]">
                          Journey Page Order &amp; Visibility
                        </p>
                        <p className="text-xs text-[#faf6f0]/55">
                          Reorder steps with the arrows or toggle any page on/off.
                        </p>
                      </div>
                      <div className="space-y-2">
                        {(
                          settingsDraft.pageOrder && settingsDraft.pageOrder.length > 0
                            ? settingsDraft.pageOrder
                            : (['gate', 'welcome', 'story', 'promises', 'gate2', 'gallery', 'wishes', 'surprise'] as StepKey[])
                        ).map((stepKey, idx, list) => {
                          const labels: Record<StepKey, string> = {
                            gate: 'Gate 1 — First Meetup',
                            welcome: 'Welcome Page',
                            story: 'Our Story',
                            promises: 'Promises (Envelopes)',
                            gate2: 'Gate 2 — Official Meetup',
                            gallery: 'Gallery (Memory Lane)',
                            wishes: 'Birthday Wishes',
                            surprise: 'Final Surprise',
                          };
                          const isChecked =
                            stepKey === 'gate'
                              ? settingsDraft.gateEnabled
                              : stepKey === 'gate2'
                                ? settingsDraft.gate2Enabled && (settingsDraft.visiblePages?.gate2 ?? true)
                                : settingsDraft.visiblePages?.[stepKey] ?? true;

                          const moveStep = (dir: -1 | 1) => {
                            const target = idx + dir;
                            if (target < 0 || target >= list.length) return;
                            const nextOrder = [...list];
                            [nextOrder[idx], nextOrder[target]] = [nextOrder[target], nextOrder[idx]];
                            setSettingsDraft({ ...settingsDraft, pageOrder: nextOrder });
                          };

                          return (
                            <div
                              key={stepKey}
                              className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[#0f1117] border border-white/10"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="font-mono-tabular text-[11px] text-[#d9b37c] w-5">
                                  {idx + 1}.
                                </span>
                                <span className="text-xs font-medium text-[#faf6f0] truncate">
                                  {labels[stepKey]}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => moveStep(-1)}
                                  aria-label={`Move ${labels[stepKey]} up`}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-25 cursor-pointer"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === list.length - 1}
                                  onClick={() => moveStep(1)}
                                  aria-label={`Move ${labels[stepKey]} down`}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-25 cursor-pointer"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    if (stepKey === 'gate') {
                                      setSettingsDraft({ ...settingsDraft, gateEnabled: checked });
                                    } else if (stepKey === 'gate2') {
                                      setSettingsDraft({
                                        ...settingsDraft,
                                        gate2Enabled: checked,
                                        visiblePages: {
                                          ...settingsDraft.visiblePages,
                                          gate2: checked,
                                        },
                                      });
                                    } else {
                                      setSettingsDraft({
                                        ...settingsDraft,
                                        visiblePages: {
                                          ...settingsDraft.visiblePages,
                                          [stepKey]: checked,
                                        },
                                      });
                                    }
                                  }}
                                  className="ml-1 accent-[#e28794] w-4 h-4 cursor-pointer"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Editable Next Button Labels */}
                    <div className="pt-4 border-t border-white/10 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-[#faf6f0]">Next Button Text</p>
                        <p className="text-xs text-[#faf6f0]/55">
                          Customize the glowing Next button label at the bottom of each page.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(
                          [
                            { key: 'welcome', label: 'Welcome Page Next Button' },
                            { key: 'story', label: 'Our Story Next Button' },
                            { key: 'promises', label: 'Promises Next Button' },
                            { key: 'gallery', label: 'Gallery Next Button' },
                            { key: 'wishes', label: 'Wishes Next Button' },
                          ] as const
                        ).map((btn) => (
                          <div key={btn.key}>
                            <label className="block text-[11px] text-[#faf6f0]/65 mb-1">
                              {btn.label}
                            </label>
                            <input
                              type="text"
                              value={settingsDraft.nextButtonLabels?.[btn.key] ?? ''}
                              onChange={(e) =>
                                setSettingsDraft({
                                  ...settingsDraft,
                                  nextButtonLabels: {
                                    ...settingsDraft.nextButtonLabels,
                                    [btn.key]: e.target.value,
                                  },
                                })
                              }
                              className="w-full h-9 px-3 rounded-lg bg-[#0f1117] border border-white/10 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* WISHES TAB */}
              {activeTab === 'wishes' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-xl font-semibold">Birthday Wishes Manager</h1>
                    <p className="text-xs text-[#faf6f0]/60 mt-0.5">
                      Each wish appears on the typewriter wishes stage with its paired photo.
                    </p>
                  </div>

                  {/* Add / Edit Wish Form */}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const payload = editingWish || newWish;
                      if (!payload.text.trim()) return;
                      const url = editingWish
                        ? `/api/admin/wishes/${editingWish.id}`
                        : '/api/admin/wishes';
                      const res = await fetch(url, {
                        method: editingWish ? 'PUT' : 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                      });
                      if (res.ok) {
                        setEditingWish(null);
                        setNewWish({ title: '', text: '', imageUrl: '' });
                        await loadAdminData();
                        onDataUpdated();
                        pushToast(editingWish ? 'Wish updated.' : 'Wish added.');
                      }
                    }}
                    className="rounded-2xl bg-[#161922] border border-white/10 p-6 space-y-4"
                  >
                    <h2 className="text-sm font-semibold">
                      {editingWish ? 'Edit Wish' : 'Add New Wish'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 space-y-3">
                        <input
                          type="text"
                          placeholder="Wish title (e.g. Wish V — For Quiet Mornings)"
                          value={editingWish ? editingWish.title : newWish.title}
                          onChange={(e) =>
                            editingWish
                              ? setEditingWish({ ...editingWish, title: e.target.value })
                              : setNewWish({ ...newWish, title: e.target.value })
                          }
                          className="w-full h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                        />
                        <textarea
                          rows={3}
                          placeholder="Write the heartfelt birthday wish..."
                          value={editingWish ? editingWish.text : newWish.text}
                          onChange={(e) =>
                            editingWish
                              ? setEditingWish({ ...editingWish, text: e.target.value })
                              : setNewWish({ ...newWish, text: e.target.value })
                          }
                          className="w-full p-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                        />
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const uploaded = await uploadSingleFile(file);
                                if (uploaded) {
                                  if (editingWish) {
                                    setEditingWish({ ...editingWish, imageUrl: uploaded.url });
                                  } else {
                                    setNewWish({ ...newWish, imageUrl: uploaded.url });
                                  }
                                }
                              }}
                            />
                          </label>
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-[#e28794] text-[#120c14] text-xs font-semibold cursor-pointer"
                          >
                            {editingWish ? 'Save Changes' : 'Add Wish'}
                          </button>
                          {editingWish && (
                            <button
                              type="button"
                              onClick={() => setEditingWish(null)}
                              className="px-3 py-2 rounded-lg text-xs text-[#faf6f0]/70 hover:bg-white/10 cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="rounded-xl overflow-hidden bg-[#0f1117] border border-white/10 h-44">
                        <ImageWithFallback
                          src={editingWish ? editingWish.imageUrl : newWish.imageUrl}
                          alt="Wish preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </form>

                  {/* Wishes List */}
                  <div className="space-y-3">
                    {data.wishes.map((w, idx) => (
                      <div
                        key={w.id}
                        className="rounded-2xl bg-[#161922] border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                      >
                        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#0f1117]">
                          <ImageWithFallback src={w.imageUrl} alt={w.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#faf6f0]">{w.title}</p>
                          <p className="text-xs text-[#faf6f0]/70 mt-1 line-clamp-2">{w.text}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleReorder('wishes', idx, -1)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                            title="Move up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === data.wishes.length - 1}
                            onClick={() => handleReorder('wishes', idx, 1)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                            title="Move down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingWish(w)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({ kind: 'wishes', id: w.id, label: w.title })
                            }
                            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GALLERY TAB */}
              {activeTab === 'gallery' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-xl font-semibold">Photo Gallery Manager</h1>
                    <p className="text-xs text-[#faf6f0]/60 mt-0.5">
                      Drag &amp; drop multiple photos, edit captions, assign albums, or reorder.
                    </p>
                  </div>

                  {/* Drag & Drop Multi-Image Uploader */}
                  <div className="rounded-2xl bg-[#161922] border border-white/10 p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Album name (e.g. Adventures)"
                        value={galleryAlbumInput}
                        onChange={(e) => setGalleryAlbumInput(e.target.value)}
                        className="h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Default caption (optional)"
                        value={galleryCaptionInput}
                        onChange={(e) => setGalleryCaptionInput(e.target.value)}
                        className="h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Date label (e.g. Nov 2026)"
                        value={galleryDateInput}
                        onChange={(e) => setGalleryDateInput(e.target.value)}
                        className="h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-xs"
                      />
                    </div>

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                      }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={onDropGallery}
                      onClick={() => galleryFileRef.current?.click()}
                      className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
                        dragActive
                          ? 'border-[#e28794] bg-[#e28794]/10'
                          : 'border-white/15 hover:border-[#d9b37c]/40 bg-[#0f1117]/60'
                      }`}
                    >
                      <Upload className="w-7 h-7 mx-auto mb-2 text-[#d9b37c]" />
                      <p className="text-sm font-medium text-[#faf6f0]">
                        {uploading
                          ? 'Uploading photos...'
                          : 'Drop multiple photos here or click to browse'}
                      </p>
                      <p className="text-xs text-[#faf6f0]/50 mt-1">
                        Supports JPEG, PNG, WebP, GIF, SVG up to 12 MB
                      </p>
                      <input
                        ref={galleryFileRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleGalleryFiles(e.target.files)}
                      />
                    </div>
                  </div>

                  {/* Edit Photo Inline Drawer */}
                  {editingPhoto && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const res = await fetch(`/api/admin/gallery/${editingPhoto.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(editingPhoto),
                        });
                        if (res.ok) {
                          setEditingPhoto(null);
                          await loadAdminData();
                          onDataUpdated();
                          pushToast('Photo details updated.');
                        }
                      }}
                      className="rounded-2xl bg-[#161922] border border-[#d9b37c]/40 p-5 space-y-3"
                    >
                      <h3 className="text-sm font-semibold">Edit Photo Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={editingPhoto.caption}
                          onChange={(e) =>
                            setEditingPhoto({ ...editingPhoto, caption: e.target.value })
                          }
                          placeholder="Caption"
                          className="h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-xs"
                        />
                        <input
                          type="text"
                          value={editingPhoto.album}
                          onChange={(e) =>
                            setEditingPhoto({ ...editingPhoto, album: e.target.value })
                          }
                          placeholder="Album"
                          className="h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-xs"
                        />
                        <input
                          type="text"
                          value={editingPhoto.capturedDate}
                          onChange={(e) =>
                            setEditingPhoto({ ...editingPhoto, capturedDate: e.target.value })
                          }
                          placeholder="Date label"
                          className="h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-xs"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-[#e28794] text-[#120c14] text-xs font-semibold cursor-pointer"
                        >
                          Save Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPhoto(null)}
                          className="px-3 py-2 rounded-lg text-xs text-[#faf6f0]/70 hover:bg-white/10 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Gallery Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.gallery.map((photo, idx) => (
                      <div
                        key={photo.id}
                        className="rounded-2xl bg-[#161922] border border-white/10 overflow-hidden flex flex-col"
                      >
                        <div className="h-44 bg-[#0f1117]">
                          <ImageWithFallback
                            src={photo.imageUrl}
                            alt={photo.caption}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-[#faf6f0] line-clamp-2">
                              {photo.caption}
                            </p>
                            <p className="text-xs text-[#faf6f0]/55 mt-1">
                              {photo.album}
                              {photo.capturedDate ? ` · ${photo.capturedDate}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-white/10">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleReorder('gallery', idx, -1)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === data.gallery.length - 1}
                                onClick={() => handleReorder('gallery', idx, 1)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingPhoto(photo)}
                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    kind: 'gallery',
                                    id: photo.id,
                                    label: photo.caption,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PROMISES TAB */}
              {activeTab === 'promises' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-xl font-semibold">Promises Manager</h1>
                    <p className="text-xs text-[#faf6f0]/60 mt-0.5">
                      Add, edit, delete, or reorder your heartfelt promises.
                    </p>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const payload = editingPromise || newPromise;
                      if (!payload.text.trim()) return;
                      const url = editingPromise
                        ? `/api/admin/promises/${editingPromise.id}`
                        : '/api/admin/promises';
                      const res = await fetch(url, {
                        method: editingPromise ? 'PUT' : 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                      });
                      if (res.ok) {
                        setEditingPromise(null);
                        setNewPromise({ icon: '❤️', title: '', text: '' });
                        await loadAdminData();
                        onDataUpdated();
                        pushToast(editingPromise ? 'Promise updated.' : 'Promise added.');
                      }
                    }}
                    className="rounded-2xl bg-[#161922] border border-white/10 p-6 space-y-4"
                  >
                    <h2 className="text-sm font-semibold">
                      {editingPromise ? 'Edit Promise' : 'Add New Promise'}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                      <input
                        type="text"
                        placeholder="Icon"
                        value={editingPromise ? editingPromise.icon : newPromise.icon}
                        onChange={(e) =>
                          editingPromise
                            ? setEditingPromise({ ...editingPromise, icon: e.target.value })
                            : setNewPromise({ ...newPromise, icon: e.target.value })
                        }
                        className="h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-center text-lg"
                      />
                      <input
                        type="text"
                        placeholder="Promise title"
                        value={editingPromise ? editingPromise.title : newPromise.title}
                        onChange={(e) =>
                          editingPromise
                            ? setEditingPromise({ ...editingPromise, title: e.target.value })
                            : setNewPromise({ ...newPromise, title: e.target.value })
                        }
                        className="sm:col-span-5 h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Write your promise..."
                      value={editingPromise ? editingPromise.text : newPromise.text}
                      onChange={(e) =>
                        editingPromise
                          ? setEditingPromise({ ...editingPromise, text: e.target.value })
                          : setNewPromise({ ...newPromise, text: e.target.value })
                      }
                      className="w-full p-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-[#e28794] text-[#120c14] text-xs font-semibold cursor-pointer"
                      >
                        {editingPromise ? 'Save Promise' : 'Add Promise'}
                      </button>
                      {editingPromise && (
                        <button
                          type="button"
                          onClick={() => setEditingPromise(null)}
                          className="px-3 py-2 rounded-lg text-xs text-[#faf6f0]/70 hover:bg-white/10 cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  <div className="space-y-3">
                    {data.promises.map((p, idx) => (
                      <div
                        key={p.id}
                        className="rounded-2xl bg-[#161922] border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                      >
                        <div className="w-11 h-11 rounded-xl bg-[#0f1117] border border-white/10 flex items-center justify-center text-xl shrink-0">
                          {p.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#faf6f0]">{p.title}</p>
                          <p className="text-xs text-[#faf6f0]/70 mt-0.5">{p.text}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleReorder('promises', idx, -1)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === data.promises.length - 1}
                            onClick={() => handleReorder('promises', idx, 1)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPromise(p)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({ kind: 'promises', id: p.id, label: p.title })
                            }
                            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TIMELINE TAB */}
              {activeTab === 'timeline' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-xl font-semibold">Our Story Timeline Manager</h1>
                    <p className="text-xs text-[#faf6f0]/60 mt-0.5">
                      Add, edit, reorder, or attach photos to each relationship milestone.
                    </p>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const payload = editingMilestone || newMilestone;
                      if (!payload.title.trim()) return;
                      const url = editingMilestone
                        ? `/api/admin/timeline/${editingMilestone.id}`
                        : '/api/admin/timeline';
                      const res = await fetch(url, {
                        method: editingMilestone ? 'PUT' : 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                      });
                      if (res.ok) {
                        setEditingMilestone(null);
                        setNewMilestone({
                          dateLabel: '',
                          title: '',
                          description: '',
                          imageUrl: '',
                          isFirstMeeting: false,
                        });
                        await loadAdminData();
                        onDataUpdated();
                        pushToast(editingMilestone ? 'Milestone updated.' : 'Milestone added.');
                      }
                    }}
                    className="rounded-2xl bg-[#161922] border border-white/10 p-6 space-y-4"
                  >
                    <h2 className="text-sm font-semibold">
                      {editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Date label (e.g. October 12, 2021)"
                        value={editingMilestone ? editingMilestone.dateLabel : newMilestone.dateLabel}
                        onChange={(e) =>
                          editingMilestone
                            ? setEditingMilestone({ ...editingMilestone, dateLabel: e.target.value })
                            : setNewMilestone({ ...newMilestone, dateLabel: e.target.value })
                        }
                        className="h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Milestone title"
                        value={editingMilestone ? editingMilestone.title : newMilestone.title}
                        onChange={(e) =>
                          editingMilestone
                            ? setEditingMilestone({ ...editingMilestone, title: e.target.value })
                            : setNewMilestone({ ...newMilestone, title: e.target.value })
                        }
                        className="h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Describe this memory..."
                      value={editingMilestone ? editingMilestone.description : newMilestone.description}
                      onChange={(e) =>
                        editingMilestone
                          ? setEditingMilestone({ ...editingMilestone, description: e.target.value })
                          : setNewMilestone({ ...newMilestone, description: e.target.value })
                      }
                      className="w-full p-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploading ? 'Uploading...' : 'Attach Milestone Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const uploaded = await uploadSingleFile(file);
                            if (uploaded) {
                              if (editingMilestone) {
                                setEditingMilestone({ ...editingMilestone, imageUrl: uploaded.url });
                              } else {
                                setNewMilestone({ ...newMilestone, imageUrl: uploaded.url });
                              }
                            }
                          }}
                        />
                      </label>
                      <label className="inline-flex items-center gap-2 text-xs text-[#faf6f0]/75 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            editingMilestone
                              ? Boolean(editingMilestone.isFirstMeeting)
                              : newMilestone.isFirstMeeting
                          }
                          onChange={(e) =>
                            editingMilestone
                              ? setEditingMilestone({
                                  ...editingMilestone,
                                  isFirstMeeting: e.target.checked,
                                })
                              : setNewMilestone({
                                  ...newMilestone,
                                  isFirstMeeting: e.target.checked,
                                })
                          }
                          className="accent-[#e28794]"
                        />
                        <span>Mark as First Meeting</span>
                      </label>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-[#e28794] text-[#120c14] text-xs font-semibold cursor-pointer"
                      >
                        {editingMilestone ? 'Save Milestone' : 'Add Milestone'}
                      </button>
                      {editingMilestone && (
                        <button
                          type="button"
                          onClick={() => setEditingMilestone(null)}
                          className="px-3 py-2 rounded-lg text-xs text-[#faf6f0]/70 hover:bg-white/10 cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  <div className="space-y-3">
                    {data.timeline.map((t, idx) => (
                      <div
                        key={t.id}
                        className="rounded-2xl bg-[#161922] border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                      >
                        {t.imageUrl && (
                          <div className="w-20 h-16 rounded-xl overflow-hidden shrink-0 bg-[#0f1117]">
                            <ImageWithFallback
                              src={t.imageUrl}
                              alt={t.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#d9b37c]">{t.dateLabel}</p>
                          <p className="text-sm font-semibold text-[#faf6f0]">{t.title}</p>
                          <p className="text-xs text-[#faf6f0]/70 mt-0.5 line-clamp-2">
                            {t.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleReorder('timeline', idx, -1)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === data.timeline.length - 1}
                            onClick={() => handleReorder('timeline', idx, 1)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingMilestone(t)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({ kind: 'timeline', id: t.id, label: t.title })
                            }
                            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FINAL LETTER TAB */}
              {activeTab === 'letter' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveSettings(settingsDraft, 'Final surprise letter saved.');
                  }}
                  className="space-y-6 max-w-3xl"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h1 className="text-xl font-semibold">Final Surprise &amp; Love Letter</h1>
                      <p className="text-xs text-[#faf6f0]/60 mt-0.5">
                        Revealed when he clicks &ldquo;Open Your Surprise&rdquo; with fireworks.
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="px-5 py-2.5 rounded-xl bg-[#e28794] text-[#120c14] text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {savingSettings ? 'Saving...' : 'Save Letter'}
                    </button>
                  </div>

                  <div className="rounded-2xl bg-[#161922] border border-white/10 p-6 space-y-5">
                    <div>
                      <label className="block text-xs text-[#faf6f0]/70 mb-1.5">Surprise Title</label>
                      <input
                        type="text"
                        value={settingsDraft.finalSurpriseTitle}
                        onChange={(e) =>
                          setSettingsDraft({ ...settingsDraft, finalSurpriseTitle: e.target.value })
                        }
                        className="w-full h-10 px-3 rounded-xl bg-[#0f1117] border border-white/10 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#faf6f0]/70 mb-1.5">Love Letter</label>
                      <textarea
                        rows={11}
                        value={settingsDraft.finalLetter}
                        onChange={(e) =>
                          setSettingsDraft({ ...settingsDraft, finalLetter: e.target.value })
                        }
                        className="w-full p-3.5 rounded-xl bg-[#0f1117] border border-white/10 text-sm leading-relaxed"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs text-[#faf6f0]/70">
                        Optional Media (Photo or Video)
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploading ? 'Uploading...' : 'Upload Image or Video'}</span>
                          <input
                            type="file"
                            accept="image/*,video/mp4,video/webm"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const uploaded = await uploadSingleFile(file);
                              if (uploaded) {
                                setSettingsDraft({
                                  ...settingsDraft,
                                  finalMediaUrl: uploaded.url,
                                  finalMediaType: uploaded.mediaType,
                                });
                              }
                            }}
                          />
                        </label>
                        <input
                          type="text"
                          placeholder="Or paste media URL"
                          value={settingsDraft.finalMediaUrl}
                          onChange={(e) =>
                            setSettingsDraft({ ...settingsDraft, finalMediaUrl: e.target.value })
                          }
                          className="flex-1 min-w-[200px] h-9 px-3 rounded-lg bg-[#0f1117] border border-white/10 text-xs"
                        />
                      </div>

                      {settingsDraft.finalMediaUrl && (
                        <div className="rounded-xl overflow-hidden max-h-60 bg-[#0f1117] border border-white/10">
                          {settingsDraft.finalMediaType === 'video' ? (
                            <video
                              src={settingsDraft.finalMediaUrl}
                              controls
                              className="w-full max-h-60 object-contain"
                            />
                          ) : (
                            <ImageWithFallback
                              src={settingsDraft.finalMediaUrl}
                              alt="Final surprise media preview"
                              className="w-full max-h-60 object-cover"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
