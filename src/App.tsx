import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { GateStatusResponse, SiteDataPayload, StepKey } from './types/app';
import { RomanticBackground } from './components/RomanticBackground';
import { BearCoupleGate } from './components/BearCoupleGate';
import { MusicPlayer } from './components/MusicPlayer';
import { StepProgressIndicator } from './components/StepNavigation';
import { WelcomePage } from './pages/WelcomePage';
import { StoryPage } from './pages/StoryPage';
import { PromisesPage } from './pages/PromisesPage';
import { GalleryPage } from './pages/GalleryPage';
import { WishesPage } from './pages/WishesPage';
import { SurprisePage } from './pages/SurprisePage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';

const STEP_PATHS: Record<StepKey, string> = {
  gate: '/',
  welcome: '/welcome',
  story: '/story',
  promises: '/promises',
  gate2: '/gate2',
  gallery: '/gallery',
  wishes: '/wishes',
  surprise: '/surprise',
};

const DEFAULT_ORDER: StepKey[] = [
  'gate',
  'welcome',
  'story',
  'promises',
  'gate2',
  'gallery',
  'wishes',
  'surprise',
];

const STORAGE_PROGRESS_KEY = 'birthday_progress_v3';

interface LocalProgressState {
  gate1Passed: boolean;
  gate2Passed: boolean;
  maxUnlockedIdx: number;
}

function loadLocalProgress(): LocalProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_PROGRESS_KEY);
    if (!raw) return { gate1Passed: false, gate2Passed: false, maxUnlockedIdx: 0 };
    const parsed = JSON.parse(raw) as Partial<LocalProgressState>;
    return {
      gate1Passed: Boolean(parsed.gate1Passed),
      gate2Passed: Boolean(parsed.gate2Passed),
      maxUnlockedIdx: Number.isFinite(parsed.maxUnlockedIdx) ? Number(parsed.maxUnlockedIdx) : 0,
    };
  } catch {
    return { gate1Passed: false, gate2Passed: false, maxUnlockedIdx: 0 };
  }
}

function saveLocalProgress(state: LocalProgressState): void {
  localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(state));
}

function pathToStep(pathname: string): StepKey | 'admin' | 'not-found' {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/admin') return 'admin';
  const entry = (Object.entries(STEP_PATHS) as [StepKey, string][]).find(
    ([, p]) => p === clean
  );
  return entry ? entry[0] : 'not-found';
}

export default function App() {
  const [route, setRoute] = useState<StepKey | 'admin' | 'not-found'>(() =>
    pathToStep(window.location.pathname)
  );
  const [siteData, setSiteData] = useState<SiteDataPayload | null>(null);
  const [serverGateStatus, setServerGateStatus] = useState<GateStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [progress, setProgress] = useState<LocalProgressState>(() => loadLocalProgress());

  const updateProgress = useCallback((updater: (prev: LocalProgressState) => LocalProgressState) => {
    setProgress((prev) => {
      const next = updater(prev);
      saveLocalProgress(next);
      return next;
    });
  }, []);

  const navigate = useCallback((to: string, replace = false) => {
    if (window.location.pathname !== to) {
      if (replace) {
        window.history.replaceState({}, '', to);
      } else {
        window.history.pushState({}, '', to);
      }
    }
    setRoute(pathToStep(to));
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setRoute(pathToStep(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const fetchSiteData = useCallback(async () => {
    try {
      setError(false);
      const [siteRes, statusRes] = await Promise.all([
        fetch('/api/public/site'),
        fetch('/api/gate/status'),
      ]);
      if (!siteRes.ok) throw new Error('Failed to load site data');
      const payload = (await siteRes.json()) as SiteDataPayload;
      setSiteData(payload);

      if (statusRes.ok) {
        const status = (await statusRes.json()) as GateStatusResponse;
        setServerGateStatus(status);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSiteData();
  }, [fetchSiteData]);

  useEffect(() => {
    if (siteData?.settings.husbandName) {
      document.title = `Happy Birthday ${siteData.settings.husbandName} — ${siteData.settings.coupleNames}`;
    }
  }, [siteData?.settings.husbandName, siteData?.settings.coupleNames]);

  // Compute dynamic ordered steps from Admin pageOrder & visibility settings
  const orderedSteps = useMemo<StepKey[]>(() => {
    if (!siteData) return DEFAULT_ORDER;
    const { gateEnabled, gate2Enabled, visiblePages, pageOrder } = siteData.settings;
    const baseOrder = Array.isArray(pageOrder) && pageOrder.length ? pageOrder : DEFAULT_ORDER;

    const steps = baseOrder.filter((step) => {
      if (step === 'gate') return gateEnabled;
      if (step === 'gate2') return gate2Enabled && (visiblePages?.gate2 ?? true);
      return visiblePages?.[step] ?? true;
    });

    if (steps.length === 0 || (steps.length === 1 && (steps[0] === 'gate' || steps[0] === 'gate2'))) {
      steps.push('welcome');
    }
    return steps;
  }, [siteData]);

  const effectiveGate1Passed =
    !siteData?.settings.gateEnabled ||
    (progress.gate1Passed && (serverGateStatus ? serverGateStatus.gate1Passed : true));

  const effectiveGate2Passed =
    !(siteData?.settings.gate2Enabled && (siteData.settings.visiblePages?.gate2 ?? true)) ||
    (progress.gate2Passed && (serverGateStatus ? serverGateStatus.gate2Passed : true));

  // Enforce strict step-locking & Gate 1 / Gate 2 server+local protection
  useEffect(() => {
    if (!siteData || route === 'admin' || route === 'not-found') return;

    const gate1Idx = orderedSteps.indexOf('gate');
    if (gate1Idx !== -1 && !effectiveGate1Passed) {
      if (route !== 'gate') {
        navigate(STEP_PATHS.gate, true);
      }
      return;
    }

    const gate2Idx = orderedSteps.indexOf('gate2');
    const requestedIdx = orderedSteps.indexOf(route);
    const firstNonGateIdx = gate1Idx === 0 && effectiveGate1Passed && orderedSteps.length > 1 ? 1 : 0;

    // Max step allowed by sequential progress
    let maxAllowedIdx = Math.min(
      Math.max(progress.maxUnlockedIdx, firstNonGateIdx),
      orderedSteps.length - 1
    );

    // Never allow skipping past Gate 2 until Gate 2 has been verified
    if (gate2Idx !== -1 && !effectiveGate2Passed) {
      maxAllowedIdx = Math.min(maxAllowedIdx, gate2Idx);
    }

    // If '/' was requested after Gate 1 already passed (and Gate 1 was step 0), forward to first content
    if (route === 'gate' && gate1Idx === 0 && effectiveGate1Passed && orderedSteps.length > 1) {
      const target = orderedSteps[Math.max(1, maxAllowedIdx === 0 ? 1 : Math.min(1, maxAllowedIdx))];
      navigate(STEP_PATHS[target], true);
      return;
    }

    if (requestedIdx === -1) {
      const target = orderedSteps[Math.min(firstNonGateIdx, maxAllowedIdx)] || orderedSteps[0];
      navigate(STEP_PATHS[target], true);
      return;
    }

    if (requestedIdx > maxAllowedIdx) {
      navigate(STEP_PATHS[orderedSteps[maxAllowedIdx]], true);
    }
  }, [
    siteData,
    route,
    orderedSteps,
    effectiveGate1Passed,
    effectiveGate2Passed,
    progress.maxUnlockedIdx,
    navigate,
  ]);

  const advanceFromStep = (currentStep: StepKey) => {
    const idx = orderedSteps.indexOf(currentStep);
    if (idx === -1 || idx + 1 >= orderedSteps.length) return;
    const nextIdx = idx + 1;
    updateProgress((prev) => ({
      ...prev,
      maxUnlockedIdx: Math.max(prev.maxUnlockedIdx, nextIdx),
    }));
    navigate(STEP_PATHS[orderedSteps[nextIdx]]);
  };

  const goBackFromStep = (currentStep: StepKey) => {
    const idx = orderedSteps.indexOf(currentStep);
    if (idx <= 0) return;
    const prevStep = orderedSteps[idx - 1];
    navigate(STEP_PATHS[prevStep]);
  };

  const handleReplayJourney = async () => {
    localStorage.removeItem(STORAGE_PROGRESS_KEY);
    setProgress({ gate1Passed: false, gate2Passed: false, maxUnlockedIdx: 0 });
    setServerGateStatus({
      gate1Passed: !siteData?.settings.gateEnabled,
      gate2Passed: !siteData?.settings.gate2Enabled,
    });
    await fetch('/api/gate/reset', { method: 'POST' }).catch(() => {});
    const startStep = orderedSteps[0];
    navigate(STEP_PATHS[startStep]);
  };

  if (route === 'admin') {
    return (
      <AdminPage
        onBackHome={() => navigate(STEP_PATHS[orderedSteps[0]])}
        onDataUpdated={fetchSiteData}
      />
    );
  }

  if (route === 'not-found') {
    return (
      <>
        <RomanticBackground subtle />
        <NotFoundPage onGoHome={() => navigate(STEP_PATHS[orderedSteps[0]])} />
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0a10] text-[#faf6f0] flex items-center justify-center px-4">
        <RomanticBackground subtle />
        <div className="relative z-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#e28794]/30 border-t-[#e28794] animate-spin mx-auto" />
          <p className="font-serif-editorial italic text-lg text-[#faf6f0]/75">
            Preparing your surprise...
          </p>
        </div>
      </div>
    );
  }

  if (error || !siteData) {
    return (
      <div className="min-h-screen bg-[#0d0a10] text-[#faf6f0] flex items-center justify-center px-4">
        <div className="glass-surface rounded-2xl p-8 max-w-sm text-center space-y-4">
          <p className="text-sm text-[#faf6f0]/80">Could not load the surprise right now.</p>
          <button
            type="button"
            onClick={fetchSiteData}
            className="px-5 py-2.5 rounded-xl bg-[#e28794] text-[#120c14] text-xs font-semibold cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentIdx = orderedSteps.indexOf(route);
  const currentStepNum = currentIdx >= 0 ? currentIdx + 1 : 1;
  const totalSteps = orderedSteps.length;
  const canGoBack = currentIdx > 0 && orderedSteps[currentIdx - 1] !== 'gate';

  return (
    <div className="min-h-screen bg-[#0d0a10] text-[#faf6f0] relative overflow-x-hidden">
      <RomanticBackground accent={siteData.settings.themeAccent} />

      {/* Small floating corner music icon (NOT in a navbar) */}
      <MusicPlayer musicUrl={siteData.settings.musicUrl} accent={siteData.settings.themeAccent} />

      {/* Small non-clickable step progress indicator */}
      {route !== 'gate' && (
        <StepProgressIndicator
          currentStepIndex={currentStepNum}
          totalSteps={totalSteps}
          accent={siteData.settings.themeAccent}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={route}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        >
          {route === 'gate' && (
            <BearCoupleGate
              gate="gate1"
              settings={siteData.settings}
              onUnlock={() => {
                setServerGateStatus((prev) => ({
                  gate1Passed: true,
                  gate2Passed: prev?.gate2Passed ?? false,
                }));
                const gateIdx = orderedSteps.indexOf('gate');
                const nextIdx = Math.min(gateIdx + 1, orderedSteps.length - 1);
                updateProgress((prev) => ({
                  ...prev,
                  gate1Passed: true,
                  maxUnlockedIdx: Math.max(prev.maxUnlockedIdx, nextIdx),
                }));
                navigate(STEP_PATHS[orderedSteps[nextIdx]]);
              }}
              onOpenAdmin={() => navigate('/admin')}
            />
          )}

          {route === 'gate2' && (
            <BearCoupleGate
              gate="gate2"
              settings={siteData.settings}
              onBack={canGoBack ? () => goBackFromStep('gate2') : undefined}
              onUnlock={() => {
                setServerGateStatus((prev) => ({
                  gate1Passed: prev?.gate1Passed ?? true,
                  gate2Passed: true,
                }));
                const gate2Idx = orderedSteps.indexOf('gate2');
                const nextIdx = Math.min(gate2Idx + 1, orderedSteps.length - 1);
                updateProgress((prev) => ({
                  ...prev,
                  gate2Passed: true,
                  maxUnlockedIdx: Math.max(prev.maxUnlockedIdx, nextIdx),
                }));
                navigate(STEP_PATHS[orderedSteps[nextIdx]]);
              }}
            />
          )}

          {route === 'welcome' && (
            <WelcomePage
              settings={siteData.settings}
              onBack={canGoBack ? () => goBackFromStep('welcome') : undefined}
              onNext={() => advanceFromStep('welcome')}
            />
          )}

          {route === 'story' && (
            <StoryPage
              items={siteData.timeline}
              settings={siteData.settings}
              onBack={canGoBack ? () => goBackFromStep('story') : undefined}
              onNext={() => advanceFromStep('story')}
            />
          )}

          {route === 'promises' && (
            <PromisesPage
              items={siteData.promises}
              settings={siteData.settings}
              onBack={canGoBack ? () => goBackFromStep('promises') : undefined}
              onNext={() => advanceFromStep('promises')}
            />
          )}

          {route === 'gallery' && (
            <GalleryPage
              items={siteData.gallery}
              settings={siteData.settings}
              onBack={canGoBack ? () => goBackFromStep('gallery') : undefined}
              onNext={() => advanceFromStep('gallery')}
            />
          )}

          {route === 'wishes' && (
            <WishesPage
              items={siteData.wishes}
              settings={siteData.settings}
              onBack={canGoBack ? () => goBackFromStep('wishes') : undefined}
              onNext={() => advanceFromStep('wishes')}
            />
          )}

          {route === 'surprise' && (
            <SurprisePage
              settings={siteData.settings}
              onBack={canGoBack ? () => goBackFromStep('surprise') : undefined}
              onReplayJourney={handleReplayJourney}
              onOpenAdmin={() => navigate('/admin')}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
