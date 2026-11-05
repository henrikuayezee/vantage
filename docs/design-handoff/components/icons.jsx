// Vantage — icon set (Lucide-style stroke icons, all 16px viewbox).
// Each component takes { size, strokeWidth, className, style }.

const Ic = ({ d, size = 16, sw = 1.6, fill = 'none', children, style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style} className={className} aria-hidden="true">
    {d ? <path d={d} /> : children}
  </svg>
);

const Icons = {
  // brand peak — used for logo
  Peak: (p) => <Ic {...p}><polyline points="2 18 8 10 12 14 16 7 22 18" /></Ic>,
  // nav
  Inbox:    (p) => <Ic {...p}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></Ic>,
  Home:     (p) => <Ic {...p} d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />,
  Projects: (p) => <Ic {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Ic>,
  My:       (p) => <Ic {...p}><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></Ic>,
  Team:     (p) => <Ic {...p}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 19a6 6 0 0 1 12 0M15 19a4.5 4.5 0 0 1 6 0" /></Ic>,
  Reports:  (p) => <Ic {...p}><path d="M3 3v18h18" /><polyline points="7 14 11 10 14 13 20 6" /></Ic>,
  Calendar: (p) => <Ic {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Ic>,
  Settings: (p) => <Ic {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Ic>,
  // topbar / utility
  Search:   (p) => <Ic {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Ic>,
  Bell:     (p) => <Ic {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a2 2 0 0 0 3.4 0" /></Ic>,
  Sun:      (p) => <Ic {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></Ic>,
  Moon:     (p) => <Ic {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></Ic>,
  Plus:     (p) => <Ic {...p}><path d="M12 5v14M5 12h14" /></Ic>,
  Chevron:  (p) => <Ic {...p}><polyline points="9 6 15 12 9 18" /></Ic>,
  Down:     (p) => <Ic {...p}><polyline points="6 9 12 15 18 9" /></Ic>,
  Up:       (p) => <Ic {...p}><polyline points="6 15 12 9 18 15" /></Ic>,
  X:        (p) => <Ic {...p}><path d="M18 6 6 18M6 6l12 12" /></Ic>,
  Filter:   (p) => <Ic {...p}><polygon points="3 4 21 4 14 13 14 20 10 20 10 13 3 4" /></Ic>,
  Sort:     (p) => <Ic {...p}><path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 4v16" /></Ic>,
  More:     (p) => <Ic {...p}><circle cx="12" cy="5" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="19" r="1.2" fill="currentColor" /></Ic>,
  MoreH:    (p) => <Ic {...p}><circle cx="5" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="19" cy="12" r="1.2" fill="currentColor" /></Ic>,
  Check:    (p) => <Ic {...p}><polyline points="4 12 10 18 20 6" /></Ic>,
  Flag:     (p) => <Ic {...p}><path d="M4 21V4h12l-2 4 2 4H4" /></Ic>,
  Clock:    (p) => <Ic {...p}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></Ic>,
  Link:     (p) => <Ic {...p}><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 1 0-7-7l-1 1" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 1 0 7 7l1-1" /></Ic>,
  Paperclip:(p) => <Ic {...p}><path d="m21 11-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5L10 18a2 2 0 0 1-3-3l8-8" /></Ic>,
  MessageCircle: (p) => <Ic {...p}><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></Ic>,
  At:       (p) => <Ic {...p}><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" /></Ic>,
  // task / status
  Circle:   (p) => <Ic {...p}><circle cx="12" cy="12" r="9" /></Ic>,
  CircleDot:(p) => <Ic {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></Ic>,
  CircleHalf:(p) => <Ic {...p}><circle cx="12" cy="12" r="9" /><path d="M12 3 A9 9 0 0 1 12 21 Z" fill="currentColor" stroke="none"/></Ic>,
  CircleCheck: (p) => <Ic {...p}><circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" style={{ color: 'currentColor' }} /><polyline points="8 12 11 15 16 9" stroke="white" /></Ic>,
  Diamond:  (p) => <Ic {...p}><path d="M12 2 22 12 12 22 2 12z" /></Ic>,
  // misc
  Lightning:(p) => <Ic {...p}><polygon points="13 2 4 14 12 14 11 22 20 10 12 10 13 2" /></Ic>,
  Folder:   (p) => <Ic {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Ic>,
  Layout:   (p) => <Ic {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></Ic>,
  List:     (p) => <Ic {...p}><path d="M8 6h13M8 12h13M8 18h13M4 6h.01M4 12h.01M4 18h.01" /></Ic>,
  Board:    (p) => <Ic {...p}><rect x="3" y="4" width="5" height="16" rx="1" /><rect x="10" y="4" width="5" height="11" rx="1" /><rect x="17" y="4" width="4" height="7" rx="1" /></Ic>,
  Gantt:    (p) => <Ic {...p}><path d="M3 6h10M7 12h12M5 18h9M3 3v18" /></Ic>,
  Sparkle:  (p) => <Ic {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></Ic>,
  Lock:     (p) => <Ic {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Ic>,
  Mail:     (p) => <Ic {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><polyline points="3 7 12 13 21 7" /></Ic>,
  Eye:      (p) => <Ic {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Ic>,
  Trash:    (p) => <Ic {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6 17.6 19.1A2 2 0 0 1 15.6 21H8.4a2 2 0 0 1-2-1.9L5 6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" /></Ic>,
  ArrowRight:(p) => <Ic {...p}><path d="M5 12h14M13 5l7 7-7 7" /></Ic>,
  Branch:   (p) => <Ic {...p}><circle cx="6" cy="4" r="2" /><circle cx="6" cy="20" r="2" /><circle cx="18" cy="12" r="2" /><path d="M6 6v12M6 14a8 8 0 0 0 8-2" /></Ic>,
  Sliders:  (p) => <Ic {...p}><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></Ic>,
  Loader:   (p) => <Ic {...p}><path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></Ic>,
  Alert:    (p) => <Ic {...p}><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></Ic>,
  Building: (p) => <Ic {...p}><rect x="4" y="2" width="16" height="20" rx="1" /><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" /></Ic>,
};

// 3-bar peak logo as a styled brand mark
const PeakMark = ({ size = 22, color = 'var(--primary)' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2 19 L9 8 L13 13 L17 6 L22 19 Z" fill={color} fillOpacity="0.14" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="17" cy="6" r="1.8" fill={color} />
  </svg>
);

Object.assign(window, { Icons, PeakMark });
