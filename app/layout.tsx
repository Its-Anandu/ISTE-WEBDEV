import type { Metadata } from 'next';
import { Outfit, Playfair_Display, Orbitron, Anton, Plus_Jakarta_Sans } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import BrainProvider from './brain/BrainProvider';
import dynamic from 'next/dynamic';
import PhysicsEngine from './brain/PhysicsEngine';
import NeuralNetwork from './brain/NeuralNetwork';
import MemoryEngine from './brain/MemoryEngine';


const MagneticCursor = dynamic(() => import('./components/MagneticCursor'));
const DigitalSoul = dynamic(() => import('./components/DigitalSoul'));
const EngineObservatory = dynamic(() => import('./components/EngineObservatory'));
const PerformanceAmplifier = dynamic(() => import('./brain/PerformanceAmplifier'));
const SecurityGuardian = dynamic(() => import('./brain/SecurityGuardian'));
const PresenceEngine = dynamic(() => import('./brain/PresenceEngine'));
const PrefetchEngine = dynamic(() => import('./brain/PrefetchEngine'));
const ColorExtractionEngine = dynamic(() => import('./brain/ColorExtractionEngine'));
const InternshipEngine = dynamic(() => import('./brain/InternshipEngine'));
const IOSAdaptiveEngine = dynamic(() => import('./engines/ios/IOSAdaptiveEngine'));
const ClientPlatformBoundary = dynamic(() => import('./brain/ClientPlatformBoundary'));
const CookieConsent = dynamic(() => import('./components/CookieConsent'));
const ThemeSwitcher = dynamic(() => import('./components/ThemeSwitcher'));

// Vercel observability — loaded async so they don't block the critical path
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif', display: 'swap' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-mono', weight: ['700', '900'], display: 'swap' });
const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton', display: 'swap' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });

import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Prevents iOS input zoom
  userScalable: false,
  viewportFit: 'cover', // Required for env(safe-area-inset-*) to work on iPhones
  themeColor: '#17120e', // Matches site background
};

export const metadata: Metadata = {
  metadataBase: new URL('https://iste-mbcet.vercel.app'),
  title: {
    default: "ISTE MBCET | Indian Society for Technical Education - Mar Baselios College",
    template: "%s | ISTE MBCET"
  },
  description: "The official Indian Society for Technical Education (ISTE) Student Chapter at Mar Baselios College of Engineering and Technology (MBCET), Trivandrum. Discover technical workshops, elite engineering internships, hackathons, and innovation communities at ISTEMBCET.",
  keywords: [
    "ISTE", "MBCET", "ISTEMBCET", "ISTE MBCET", 
    "Indian Society for Technical Education", 
    "Mar Baselios College of Engineering and Technology", 
    "Trivandrum", "Kerala", "Engineering", "Technical Education", 
    "Student Chapter", "Tech Community", "Workshops", "Hackathons", 
    "Internships", "Engineering Students", "BTech"
  ],
  authors: [{ name: "ISTE MBCET Student's Chapter" }],
  creator: "ISTE MBCET",
  publisher: "ISTE MBCET",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://iste-mbcet.vercel.app",
    title: "ISTE MBCET | Indian Society for Technical Education",
    description: "The official ISTE Student Chapter at Mar Baselios College of Engineering and Technology (MBCET). Empowering engineering students through innovation and technology.",
    siteName: "ISTE MBCET",
    images: [
      {
        url: "/iste.png",
        width: 1200,
        height: 630,
        alt: "ISTE MBCET Student's Chapter Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ISTE MBCET | Engineering Community",
    description: "The official ISTE Student Chapter at Mar Baselios College of Engineering and Technology (MBCET).",
    images: ["/iste.png"],
    creator: "@iste_mbcet",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/iste.png",
    apple: "/iste.png",
  },
  verification: {
    google: "nXHbXTdgWRTlc3Q2BeBRp9mlojQVs7Eta8i8xNwM1dQ",
  },
};

import LenisProvider from './components/LenisProvider';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get('next-url') || '';
  const isStudio = pathname.startsWith('/studio');
  const isAdmin = pathname.startsWith('/admin');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: "ISTE MBCET - Indian Society for Technical Education",
    alternateName: ["ISTEMBCET", "ISTE Mar Baselios", "ISTE MBCET Student Chapter"],
    url: 'https://iste-mbcet.vercel.app',
    logo: 'https://iste-mbcet.vercel.app/iste.png',
    description: "The official Indian Society for Technical Education (ISTE) Student Chapter at Mar Baselios College of Engineering and Technology (MBCET).",
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Trivandrum',
      addressRegion: 'Kerala',
      addressCountry: 'IN'
    },
    sameAs: [
      'https://www.instagram.com/iste_mbcet/',
      'https://www.linkedin.com/company/istescmbcet/'
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var ua = navigator.userAgent;
                  var isIOS = /iPad|iPhone|iPod/.test(ua);
                  var isSafari = /^((?!chrome|android).)*safari/i.test(ua);
                  var isWebView = /(FBAN|FBAV|Instagram|WhatsApp|Line)/i.test(ua);
                  
                  if (isIOS) {
                    document.documentElement.classList.add('safari-compatibility-mode');
                    document.documentElement.classList.add('ios-motion-governed');
                    
                    if (isWebView || !isSafari) {
                      document.documentElement.classList.add('ios-webview-survival');
                      document.documentElement.classList.add('ios-gpu-throttled');
                    }
                  }
                } catch(e) {}
              })();
            `
          }}
        />
      </head>
      <body
        className={`${outfit.variable} ${playfair.variable} ${orbitron.variable} ${anton.variable} ${jakarta.variable} font-sans`}
        suppressHydrationWarning
      >

        <BrainProvider>
          <IOSAdaptiveEngine />

          {/* Always load: critical for all devices */}
          <MemoryEngine />
          <SecurityGuardian />
          <PrefetchEngine />

          {/* Heavy engines: skip entirely on iOS to prevent memory crash */}
          <ClientPlatformBoundary>
            <PhysicsEngine />
            <NeuralNetwork />
            <ColorExtractionEngine />
            {!isStudio && <DigitalSoul />}
          </ClientPlatformBoundary>

          {/* Render page content first */}
          <LenisProvider>
            {children}
          </LenisProvider>

          {/* Secondary engines: load after content on all devices */}
          <PerformanceAmplifier />
          <InternshipEngine />
          {/* <PresenceEngine /> Disabled temporarily to completely isolate iOS crash factors */ }

          {!isStudio && <MagneticCursor />}
          {!isStudio && (process.env.NODE_ENV === 'development' || isAdmin) && <EngineObservatory />}

          {/* Compliance */}
          {!isStudio && <CookieConsent />}

          {/* Theme Switcher — global floating control */}
          {!isStudio && <ThemeSwitcher />}

          {/* Vercel Observability */}
          <Analytics />
          <SpeedInsights />
        </BrainProvider>
      </body>
    </html>
  );
}
