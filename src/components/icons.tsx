import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Broom,
  Building2,
  Mail as MailIcon,
  PartyPopper,
  RadioTower,
  Users as UsersIcon,
  Bell,
  Bot,
  CalendarDays,
  Check,
  CircleDollarSign,
  ClipboardList,
  Clock,
  Coffee,
  CreditCard,
  Database,
  Dices,
  Eye,
  FileText,
  Flame,
  FolderOpen,
  Handshake,
  HeartPulse,
  Mail,
  Megaphone,
  Palette,
  Package,
  Paperclip,
  PenLine,
  Plug,
  Receipt,
  Rocket,
  Ruler,
  Search,
  SearchX,
  Send,
  Settings2,
  Shuffle,
  Sparkles,
  Sprout,
  Tag,
  Target,
  TrendingUp,
  Wallet,
  Wand2,
  Zap,
} from "lucide-react";

/**
 * The icon vocabulary.
 *
 * One registry, so the whole app draws from the same set and an emoji never
 * creeps back in as an icon. Icons are named for what they mean, not for the
 * shape they resemble.
 */
export const ICONS = {
  analytics: BarChart3,
  attention: Bell,
  bot: Bot,
  calendar: CalendarDays,
  check: Check,
  money: CircleDollarSign,
  checklist: ClipboardList,
  clock: Clock,
  coffee: Coffee,
  invoice: CreditCard,
  database: Database,
  template: Dices,
  book: BookOpen,
  broom: Broom,
  building: Building2,
  party: PartyPopper,
  signal: RadioTower,
  users: UsersIcon,
  preview: Eye,
  document: FileText,
  urgent: Flame,
  folder: FolderOpen,
  deal: Handshake,
  health: HeartPulse,
  email: MailIcon,
  mail: MailIcon,
  campaign: Megaphone,
  palette: Palette,
  package: Package,
  attachment: Paperclip,
  content: PenLine,
  integration: Plug,
  receipt: Receipt,
  launch: Rocket,
  measurement: Ruler,
  search: Search,
  notFound: SearchX,
  send: Send,
  setup: Settings2,
  route: Shuffle,
  sparkle: Sparkles,
  new: Sprout,
  tag: Tag,
  goal: Target,
  trend: TrendingUp,
  wallet: Wallet,
  magic: Wand2,
  speed: Zap,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

/** Render an icon by name at a consistent size. */
export function Icon({
  name,
  className,
  size = "md",
}: {
  name: IconName;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const Glyph = ICONS[name];
  const sizing = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }[size];

  return <Glyph className={className ?? sizing} aria-hidden="true" />;
}
