import React, { useId } from 'react';

export function NbvShieldEmblem({
  size = 42,
  className = '',
  alt = 'NBV Official Logo',
}: {
  size?: number;
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src="/nbv-official-logo.png"
      alt={alt}
      width={size}
      height={size}
      className={`shrink-0 select-none object-contain rounded-full ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      loading="eager"
      decoding="async"
    />
  );
}

export function WalletWithCoins({ size = 110, className = '' }: { size?: number; className?: string }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`coinA-${uid}`} x1="30" y1="8" x2="72" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="45%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id={`coinB-${uid}`} x1="62" y1="16" x2="104" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id={`walletBack-${uid}`} x1="18" y1="34" x2="104" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#047857" />
          <stop offset="100%" stopColor="#022C22" />
        </linearGradient>
        <linearGradient id={`walletFront-${uid}`} x1="16" y1="42" x2="102" y2="106" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="30%" stopColor="#10B981" />
          <stop offset="75%" stopColor="#047857" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
        <linearGradient id={`clasp-${uid}`} x1="72" y1="62" x2="110" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
      </defs>

      {/* Left Gold Coin */}
      <circle cx="51" cy="34" r="22" fill={`url(#coinA-${uid})`} />
      <circle cx="51" cy="34" r="17.5" stroke="#92400E" strokeOpacity="0.4" strokeWidth="2" />
      <ellipse cx="45" cy="26" rx="8" ry="4" transform="rotate(-25 45 26)" fill="#FFFBEB" fillOpacity="0.55" />

      {/* Right Gold Coin */}
      <circle cx="82" cy="40" r="20" fill={`url(#coinB-${uid})`} />
      <circle cx="82" cy="40" r="15.5" stroke="#78350F" strokeOpacity="0.4" strokeWidth="2" />
      <ellipse cx="77" cy="33" rx="7" ry="3.5" transform="rotate(-25 77 33)" fill="#FFFBEB" fillOpacity="0.5" />

      {/* Wallet Back Flap */}
      <rect x="18" y="38" width="86" height="62" rx="14" fill={`url(#walletBack-${uid})`} stroke="#FACC15" strokeOpacity="0.45" strokeWidth="1.5" />

      {/* Wallet Inner Gold Trim */}
      <rect x="22" y="42" width="80" height="10" rx="5" fill="#D97706" fillOpacity="0.65" />

      {/* Wallet Front Body */}
      <rect x="14" y="46" width="88" height="58" rx="14" fill={`url(#walletFront-${uid})`} />
      {/* Gloss Highlight */}
      <path d="M28 46H88C95.7 46 102 52.3 102 60V63C76 58 42 58 14 66V60C14 52.3 20.3 46 28 46Z" fill="white" fillOpacity="0.18" />
      {/* Stitching */}
      <rect
        x="19"
        y="51"
        width="78"
        height="48"
        rx="10"
        stroke="#A7F3D0"
        strokeOpacity="0.45"
        strokeWidth="1.2"
        strokeDasharray="3.5 3.5"
      />

      {/* Clasp Strap */}
      <rect x="72" y="64" width="36" height="22" rx="11" fill="#022C22" fillOpacity="0.45" />
      <rect x="70" y="62" width="37" height="22" rx="11" fill={`url(#clasp-${uid})`} stroke="#6EE7B7" strokeOpacity="0.5" strokeWidth="1.2" />
      {/* Gold Snap Button */}
      <circle cx="82" cy="73" r="5.5" fill={`url(#coinA-${uid})`} />
      <circle cx="80.5" cy="71.5" r="1.8" fill="#FFFBEB" fillOpacity="0.8" />
    </svg>
  );
}

export function WithdrawTrayIcon({ size = 44 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`wdGold-${uid}`} x1="10" y1="8" x2="46" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="45%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
      {/* Tray */}
      <path
        d="M11 33V41C11 43.8 13.2 46 16 46H40C42.8 46 45 43.8 45 41V33"
        stroke="#78350F"
        strokeOpacity="0.45"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 32V40C11 42.8 13.2 45 16 45H40C42.8 45 45 42.8 45 40V32"
        stroke={`url(#wdGold-${uid})`}
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Upward 3D Arrow */}
      <path
        d="M28 10L40 23H32.5V35H23.5V23H16L28 10Z"
        fill="#78350F"
        fillOpacity="0.35"
        transform="translate(0, 2)"
      />
      <path d="M28 10L40 23H32.5V35H23.5V23H16L28 10Z" fill={`url(#wdGold-${uid})`} />
    </svg>
  );
}

export function ReceiptHistoryIcon({ size = 44 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`rcpt-${uid}`} x1="14" y1="8" x2="42" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFE4E6" />
          <stop offset="55%" stopColor="#FDA4AF" />
          <stop offset="100%" stopColor="#FB7185" />
        </linearGradient>
      </defs>
      <path
        d="M15 12C15 9.8 16.8 8 19 8H39C41.2 8 43 9.8 43 12V46L38.3 43L33.6 46L29 43L24.3 46L19.6 43L15 46V12Z"
        fill={`url(#rcpt-${uid})`}
      />
      <rect x="21" y="16" width="16" height="3.2" rx="1.6" fill="#BE123C" />
      <rect x="21" y="23" width="16" height="3.2" rx="1.6" fill="#BE123C" />
      <rect x="21" y="30" width="11" height="3.2" rx="1.6" fill="#BE123C" />
    </svg>
  );
}

export function StackedPlansIcon({ size = 44 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`layerTop-${uid}`} x1="12" y1="10" x2="44" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id={`layerMid-${uid}`} x1="12" y1="20" x2="44" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id={`layerBot-${uid}`} x1="12" y1="30" x2="44" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <path d="M28 31L46 40L28 49L10 40L28 31Z" fill={`url(#layerBot-${uid})`} />
      <path d="M28 21L46 30L28 39L10 30L28 21Z" fill={`url(#layerMid-${uid})`} />
      <path d="M28 11L46 20L28 29L10 20L28 11Z" fill={`url(#layerTop-${uid})`} />
    </svg>
  );
}

export function PurpleTeamIcon({ size = 42 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`pTeam-${uid}`} x1="12" y1="12" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F3E8FF" />
          <stop offset="45%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#7E22CE" />
        </linearGradient>
      </defs>
      {/* Side members */}
      <circle cx="16" cy="24" r="5.5" fill="#A855F7" />
      <path d="M7 40C7 35.2 10.8 32 16 32C21.2 32 25 35.2 25 40V42H7V40Z" fill="#9333EA" />
      <circle cx="40" cy="24" r="5.5" fill="#A855F7" />
      <path d="M31 40C31 35.2 34.8 32 40 32C45.2 32 49 35.2 49 40V42H31V40Z" fill="#9333EA" />
      {/* Center member */}
      <circle cx="28" cy="19" r="7" fill={`url(#pTeam-${uid})`} />
      <path d="M16 42C16 35.4 21.2 30.5 28 30.5C34.8 30.5 40 35.4 40 42V44H16V42Z" fill={`url(#pTeam-${uid})`} />
    </svg>
  );
}

export function PinkProfitChartIcon({ size = 42 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`pChart-${uid}`} x1="12" y1="10" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBCFE8" />
          <stop offset="50%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#BE185D" />
        </linearGradient>
      </defs>
      <rect x="12" y="33" width="7" height="12" rx="2" fill={`url(#pChart-${uid})`} />
      <rect x="24" y="26" width="7" height="19" rx="2" fill={`url(#pChart-${uid})`} />
      <rect x="36" y="18" width="7" height="27" rx="2" fill={`url(#pChart-${uid})`} />
      <path
        d="M13 26L25 17L31 20L43 10M43 10H35M43 10V18"
        stroke="#FB7185"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CyanClockHistoryIcon({ size = 42 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <path
        d="M14 20C17.1 14 23.3 10 30.5 10C40.7 10 49 18.3 49 28.5C49 38.7 40.7 47 30.5 47C21.6 47 14.2 40.7 12.4 32.3"
        stroke="#22D3EE"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path d="M12 11V21H22" stroke="#FACC15" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30.5 19V29L37 33" stroke="#FACC15" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LimeAndroidPhoneIcon({ size = 42 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <rect x="16" y="8" width="24" height="40" rx="5.5" stroke="#84CC16" strokeWidth="4" />
      <line x1="25" y1="42" x2="31" y2="42" stroke="#BEF264" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export function StackedGoldCoinsIcon({ size = 38 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`sCoin-${uid}`} x1="10" y1="10" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#A16207" />
        </linearGradient>
      </defs>
      <ellipse cx="23" cy="39" rx="13" ry="5.5" fill="#A16207" />
      <ellipse cx="23" cy="35" rx="13" ry="5.5" fill={`url(#sCoin-${uid})`} />
      <ellipse cx="23" cy="29" rx="13" ry="5.5" fill="#CA8A04" />
      <ellipse cx="23" cy="25" rx="13" ry="5.5" fill={`url(#sCoin-${uid})`} />
      <ellipse cx="23" cy="18" rx="13" ry="5.5" fill={`url(#sCoin-${uid})`} />
      <circle cx="38" cy="34" r="10" fill={`url(#sCoin-${uid})`} stroke="#78350F" strokeOpacity="0.35" strokeWidth="1.5" />
    </svg>
  );
}

export function EmeraldGiftIcon({ size = 38 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`giftBox-${uid}`} x1="12" y1="20" x2="44" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#065F46" />
        </linearGradient>
        <linearGradient id={`giftGold-${uid}`} x1="20" y1="10" x2="36" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <rect x="13" y="25" width="30" height="22" rx="4" fill={`url(#giftBox-${uid})`} />
      <rect x="10" y="19" width="36" height="8" rx="3" fill="#10B981" />
      <rect x="25" y="19" width="6" height="28" fill={`url(#giftGold-${uid})`} />
      <rect x="13" y="33" width="30" height="5" fill={`url(#giftGold-${uid})`} />
      <path
        d="M28 19C24 19 19 16.5 19 13C19 10.5 21.5 9 24 10.5C26 11.7 28 15.5 28 19ZM28 19C32 19 37 16.5 37 13C37 10.5 34.5 9 32 10.5C30 11.7 28 15.5 28 19Z"
        stroke={`url(#giftGold-${uid})`}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function WhatsAppSquareIcon({ size = 46 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`waBg-${uid}`} x1="6" y1="6" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="55%" stopColor="#16A34A" />
          <stop offset="100%" stopColor="#065F46" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="48" height="48" rx="14" fill={`url(#waBg-${uid})`} stroke="#86EFAC" strokeOpacity="0.5" strokeWidth="1.2" />
      <path
        d="M28 14C20.3 14 14 20.1 14 27.6C14 30.2 14.8 32.7 16.1 34.8L14.5 41.5L21.5 39.8C23.5 40.8 25.7 41.3 28 41.3C35.7 41.3 42 35.2 42 27.6C42 20.1 35.7 14 28 14Z"
        stroke="white"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M23.5 22.2C23.1 21.4 22.7 21.4 22.3 21.4H21.3C20.9 21.4 20.3 21.6 19.9 22.1C19.4 22.6 18.2 23.7 18.2 26C18.2 28.3 19.9 30.5 20.2 30.8C20.4 31.1 23.5 35.9 28.4 37.8C32.5 39.4 33.3 39.1 34.2 39C35.1 38.9 37 37.9 37.4 36.8C37.8 35.7 37.8 34.8 37.7 34.6C37.6 34.4 37.2 34.2 36.6 33.9C36 33.6 33.7 32.5 33.2 32.3C32.8 32.1 32.5 32 32.1 32.5C31.8 33 30.9 34 30.6 34.3C30.3 34.6 30 34.7 29.5 34.4C29 34.1 27.3 33.6 25.3 31.8C23.8 30.4 22.8 28.7 22.5 28.2C22.2 27.7 22.5 27.4 22.7 27.1C23 26.9 23.3 26.5 23.5 26.2C23.8 25.9 23.9 25.7 24 25.3C24.2 25 24.1 24.7 24 24.4C23.9 24.1 23.8 23 23.5 22.2Z"
        fill="white"
        transform="scale(0.82) translate(6.2, 4.8)"
      />
    </svg>
  );
}

export function SupportChatSquareIcon({ size = 46 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`supBg-${uid}`} x1="6" y1="6" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="55%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
      </defs>
      <rect
        x="4"
        y="4"
        width="48"
        height="48"
        rx="14"
        fill={`url(#supBg-${uid})`}
        stroke="#A7F3D0"
        strokeOpacity="0.55"
        strokeWidth="1.2"
      />
      {/* Main Support Chat Bubble */}
      <path
        d="M15 18C15 15.8 16.8 14 19 14H35C37.2 14 39 15.8 39 18V28C39 30.2 37.2 32 35 32H24L17.5 37V32H19C16.8 32 15 30.2 15 28V18Z"
        fill="white"
      />
      <circle cx="22.5" cy="23" r="1.9" fill="#065F46" />
      <circle cx="27" cy="23" r="1.9" fill="#065F46" />
      <circle cx="31.5" cy="23" r="1.9" fill="#065F46" />
      {/* Gold Reply Accent Bubble */}
      <path
        d="M27 35H38C40.2 35 42 36.8 42 39V42.5L38 39.5H27C25.3 39.5 24 38.2 24 36.5C24 35.7 25.3 35 27 35Z"
        fill="#FACC15"
      />
    </svg>
  );
}

export function CertificateGoldSquareIcon({ size = 46 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`certBg-${uid}`} x1="6" y1="6" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="55%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#A16207" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="48" height="48" rx="14" fill={`url(#certBg-${uid})`} stroke="#FEF9C3" strokeOpacity="0.6" strokeWidth="1.2" />
      <rect x="16" y="14" width="22" height="27" rx="3" stroke="white" strokeWidth="2.8" />
      <line x1="21" y1="21" x2="33" y2="21" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
      <line x1="21" y1="27" x2="30" y2="27" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="35" cy="34" r="5" fill="#EAB308" stroke="white" strokeWidth="2.6" />
      <path d="M33 38.5L32 44L35 42L38 44L37 38.5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PromoSkylineArtwork({ className = '' }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 240 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`barGold-${uid}`} x1="120" y1="20" x2="230" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="55%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id={`towerEm-${uid}`} x1="80" y1="16" x2="140" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#022C22" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={`shieldCrys-${uid}`} x1="115" y1="35" x2="185" y2="125" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#022C22" />
        </linearGradient>
      </defs>

      {/* Subtle golden glow */}
      <circle cx="160" cy="84" r="64" fill="#10B981" fillOpacity="0.16" />
      <circle cx="185" cy="72" r="46" fill="#FACC15" fillOpacity="0.14" />

      {/* Emerald City Skyline Towers */}
      <rect x="64" y="54" width="14" height="72" rx="2" fill={`url(#towerEm-${uid})`} opacity="0.55" />
      <rect x="82" y="34" width="16" height="92" rx="2" fill={`url(#towerEm-${uid})`} opacity="0.75" />
      <rect x="102" y="20" width="18" height="106" rx="2" fill={`url(#towerEm-${uid})`} opacity="0.85" />
      <rect x="172" y="18" width="16" height="108" rx="2" fill={`url(#towerEm-${uid})`} opacity="0.7" />

      {/* Rising Gold Financial Bars on Right */}
      <rect x="184" y="64" width="11" height="58" rx="2" fill={`url(#barGold-${uid})`} opacity="0.8" />
      <rect x="199" y="46" width="11" height="76" rx="2" fill={`url(#barGold-${uid})`} opacity="0.9" />
      <rect x="214" y="26" width="12" height="96" rx="2" fill={`url(#barGold-${uid})`} />

      {/* Golden Platform Pedestal */}
      <ellipse cx="152" cy="134" rx="68" ry="12" fill="#064E3B" stroke={`url(#barGold-${uid})`} strokeWidth="2" />
      <ellipse cx="152" cy="130" rx="58" ry="9" fill="#022C22" stroke="#FACC15" strokeOpacity="0.5" strokeWidth="1.2" />

      {/* Emerald Wallet Behind Shield Right */}
      <rect x="174" y="84" width="52" height="40" rx="8" fill="#064E3B" stroke="#34D399" strokeOpacity="0.5" strokeWidth="1.2" />
      <rect x="208" y="98" width="20" height="12" rx="6" fill="#047857" stroke="#FACC15" strokeOpacity="0.6" strokeWidth="1" />
      <circle cx="214" cy="104" r="2.8" fill="#FACC15" />

      {/* Center Faceted NBV Crystal Shield */}
      <path
        d="M150 34L186 47V76C186 99 170.5 116.5 150 125C129.5 116.5 114 99 114 76V47L150 34Z"
        fill={`url(#barGold-${uid})`}
      />
      <path
        d="M150 39L181 50.2V75.5C181 95.3 167.8 110.7 150 118.2C132.2 110.7 119 95.3 119 75.5V50.2L150 39Z"
        fill={`url(#shieldCrys-${uid})`}
      />
      <path d="M150 39L119 50.2V75.5L171 46.5L150 39Z" fill="white" fillOpacity="0.16" />
      <text
        x="150"
        y="84"
        textAnchor="middle"
        fill={`url(#barGold-${uid})`}
        fontSize="20"
        fontWeight="800"
        fontFamily="Outfit, Plus Jakarta Sans, sans-serif"
        letterSpacing="0.5"
      >
        NBV
      </text>

      {/* Gold Coin Stacks on Pedestal */}
      <ellipse cx="116" cy="126" rx="11" ry="4" fill={`url(#barGold-${uid})`} />
      <ellipse cx="116" cy="121" rx="11" ry="4" fill={`url(#barGold-${uid})`} />
      <ellipse cx="116" cy="116" rx="11" ry="4" fill="#FEF08A" />
      <ellipse cx="176" cy="126" rx="10" ry="3.8" fill={`url(#barGold-${uid})`} />
      <ellipse cx="176" cy="121" rx="10" ry="3.8" fill="#FEF08A" />
    </svg>
  );
}
