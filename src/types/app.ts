export type ThemeAccent = 'rose-gold' | 'champagne' | 'blush' | 'crimson';

export type StepKey =
  | 'gate'
  | 'welcome'
  | 'story'
  | 'promises'
  | 'gate2'
  | 'gallery'
  | 'wishes'
  | 'surprise';

export interface VisiblePagesConfig {
  welcome: boolean;
  story: boolean;
  promises: boolean;
  gate2: boolean;
  gallery: boolean;
  wishes: boolean;
  surprise: boolean;
}

export interface NextButtonLabelsConfig {
  welcome: string;
  story: string;
  promises: string;
  gallery: string;
  wishes: string;
}

export interface WelcomeVideo {
  id: string;
  url: string;
  title: string;
  text: string;
}

export interface PublicSettings {
  husbandName: string;
  wifeName: string;
  coupleNames: string;
  heroIntro: string;
  welcomeVideoUrl: string;
  welcomeVideoTitle: string;
  welcomeVideoText: string;
  welcomeVideos: WelcomeVideo[];
  togetherSinceDate: string;

  // Gate 1 (First Meetup) - correct date is NEVER exposed here
  gateEnabled: boolean;
  gateTitle: string;
  gateQuestion: string;
  hints: string[];
  wrongMessages: string[];
  extraHintAfterAttempts: string;
  gate1SuccessMessage: string;

  // Gate 2 (Second / Official Meetup) - correct date is NEVER exposed here
  gate2Enabled: boolean;
  gate2Title: string;
  gate2Question: string;
  gate2Hints: string[];
  gate2WrongMessages: string[];
  gate2ExtraHint: string;
  gate2SuccessMessage: string;

  musicUrl: string;
  themeAccent: ThemeAccent;
  finalSurpriseTitle: string;
  finalLetter: string;
  finalMediaUrl: string;
  finalMediaType: 'image' | 'video';

  visiblePages: VisiblePagesConfig;
  pageOrder: StepKey[];
  nextButtonLabels: NextButtonLabelsConfig;
}

export interface AdminSettings extends PublicSettings {
  first_meet_date: string; // DDMMYYYY e.g. "08042023"
  second_meet_date: string; // DDMMYYYY e.g. "23042023"
}

export interface WishItem {
  id: string;
  title: string;
  text: string;
  imageUrl: string;
  sort_order: number;
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  caption: string;
  album: string;
  capturedDate: string;
  sort_order: number;
  createdAt: string;
}

export interface PromiseItem {
  id: string;
  icon: string;
  title: string;
  text: string;
  sort_order: number;
  createdAt: string;
}

export interface TimelineItem {
  id: string;
  dateLabel: string;
  title: string;
  description: string;
  imageUrl: string;
  isFirstMeeting?: boolean;
  sort_order: number;
  createdAt: string;
}

export interface SiteDataPayload {
  settings: PublicSettings;
  wishes: WishItem[];
  gallery: GalleryItem[];
  promises: PromiseItem[];
  timeline: TimelineItem[];
}

export interface AdminDataPayload {
  settings: AdminSettings;
  wishes: WishItem[];
  gallery: GalleryItem[];
  promises: PromiseItem[];
  timeline: TimelineItem[];
}

export interface VerifyGateResponse {
  ok: boolean;
  message?: string;
  extraHint?: string;
}

export interface GateStatusResponse {
  gate1Passed: boolean;
  gate2Passed: boolean;
}
