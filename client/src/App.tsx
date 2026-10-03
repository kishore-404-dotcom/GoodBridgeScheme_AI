import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProfileProvider } from './context/ProfileContext';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { EligibilityAssessment } from './components/EligibilityAssessment';
import { CategoryGrid } from './components/CategoryGrid';
import { HowItWorks } from './components/HowItWorks';
import { VoiceChatWidget } from './components/VoiceChatWidget';
import { SchemesPage } from './pages/SchemesPage';
import { SchemeDetailPage } from './pages/SchemeDetailPage';
import { ApiService } from './services/apiService';
import { VERIFIED_SCHEMES_100 } from './data/seedSchemes';
import { useHashRoute, navigate } from './hooks/useHashRoute';
import { useSiteText } from './hooks/useSiteText';
import { Scheme } from '../../shared/types';
import { ShieldCheck, ExternalLink, ArrowRight } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const route = useHashRoute();
  const st = useSiteText();
  const [allSchemes, setAllSchemes] = useState<Scheme[]>(VERIFIED_SCHEMES_100);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  useEffect(() => {
    const loadSchemes = async () => {
      const apiSchemes = await ApiService.fetchSchemes();
      if (apiSchemes && apiSchemes.length > 0) setAllSchemes(apiSchemes);
    };
    loadSchemes();
  }, []);

  const openChat = () => setIsVoiceOpen(true);
  const openScheme = (schemeId: string) => navigate(`/scheme/${schemeId}`);

  const renderPage = () => {
    switch (route.page) {
      case 'schemes':
        return (
          <SchemesPage
            // Remount when the URL filters change (e.g. a new search from the home page)
            key={route.params.toString()}
            schemes={allSchemes}
            initialQuery={route.params.get('q') || ''}
            initialCategory={route.params.get('category') || ''}
          />
        );
      case 'scheme':
        return <SchemeDetailPage scheme={allSchemes.find((s) => s.schemeId === route.schemeId) || null} onOpenChat={openChat} />;
      case 'eligibility':
        // The assessment report is the only content printed ("Download PDF Report")
        return <EligibilityAssessment onSelectScheme={openScheme} onOpenChat={openChat} />;
      default:
        return (
          <>
            <HeroBanner
              schemeCount={allSchemes.length}
              onSearch={(q) => navigate(q ? `/schemes?q=${encodeURIComponent(q)}` : '/schemes')}
              onCheckEligibilityClick={() => navigate('/eligibility')}
              onOpenVoiceWidget={openChat}
            />
            <CategoryGrid onSelectCategory={(cat) => navigate(`/schemes?category=${encodeURIComponent(cat)}`)} />
            <div className="text-center -mt-2">
              <a
                href="#/schemes"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-500 font-bold text-sm transition-colors"
              >
                {st('viewAllSchemes')} <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <HowItWorks />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar currentPage={route.page} onOpenVoiceWidget={openChat} />

      <main className="flex-1 pb-16 print:pb-0">{renderPage()}</main>

      <footer className="print:hidden bg-slate-900 text-slate-400 border-t border-slate-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-start">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-white">GoodBridgeScheme AI</span>
            </div>
            <p className="text-sm text-slate-400">{st('footerTagline')}</p>
            <p className="text-xs text-slate-500">{st('footerDisclaimer')}</p>
          </div>
          <div className="flex flex-col gap-2 text-sm font-semibold">
            <a href="#/schemes" className="hover:text-emerald-400">{st('navSchemes')}</a>
            <a href="#/eligibility" className="hover:text-emerald-400">{st('navEligibility')}</a>
            <a href="https://www.myscheme.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 flex items-center gap-1">
              {st('officialPortalLink')} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      <div className="print:hidden">
        <VoiceChatWidget isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} onSelectScheme={openScheme} />
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ProfileProvider>
          <MainAppContent />
        </ProfileProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};
