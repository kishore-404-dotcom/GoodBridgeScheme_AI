import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProfileProvider } from './context/ProfileContext';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { PersonaQuickSelect } from './components/PersonaQuickSelect';
import { QuickEligibilityCard } from './components/QuickEligibilityCard';
import { CategoryGrid } from './components/CategoryGrid';
import { VsComparison } from './components/VsComparison';
import { HowItWorks } from './components/HowItWorks';
import { SchemeCatalog } from './components/SchemeCatalog';
import { SchemeDetailModal } from './components/SchemeDetailModal';
import { DocumentReadinessModal } from './components/DocumentReadinessModal';
import { VoiceChatWidget } from './components/VoiceChatWidget';
import { AuthModal } from './components/AuthModal';
import { ApiService } from './services/apiService';
import { VERIFIED_SCHEMES_100 } from './data/seedSchemes';
import { Scheme } from '../../shared/types';
import { ShieldCheck, ExternalLink } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const [allSchemes, setAllSchemes] = useState<Scheme[]>(VERIFIED_SCHEMES_100);
  const [filteredSchemes, setFilteredSchemes] = useState<Scheme[]>(VERIFIED_SCHEMES_100);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawers state
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);
  const [documentCheckScheme, setDocumentCheckScheme] = useState<Scheme | null>(null);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    const loadSchemes = async () => {
      const apiSchemes = await ApiService.fetchSchemes();
      if (apiSchemes && apiSchemes.length > 0) {
        setAllSchemes(apiSchemes);
        setFilteredSchemes(apiSchemes);
      }
    };
    loadSchemes();
  }, []);

  // Filter schemes when category or search changes
  useEffect(() => {
    let result = [...allSchemes];

    if (selectedCategory !== 'All') {
      result = result.filter((s) => s.category.toLowerCase().includes(selectedCategory.toLowerCase()));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    setFilteredSchemes(result);
  }, [selectedCategory, searchQuery, allSchemes]);

  const activeDetailScheme = allSchemes.find((s) => s.schemeId === selectedSchemeId) || null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Header Navigation Bar */}
      <Navbar
        onSearchChange={setSearchQuery}
        onOpenVoiceWidget={() => setIsVoiceOpen(true)}
        onOpenAuthModal={() => setIsAuthOpen(true)}
        onOpenBookmarks={() => {
          const el = document.getElementById('scheme-catalog');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 space-y-4 pb-20">
        {/* 1. Hero Section */}
        <HeroBanner
          onCheckEligibilityClick={() => {
            const el = document.getElementById('eligibility-checker');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenVoiceWidget={() => setIsVoiceOpen(true)}
        />

        {/* 2. Persona Quick-Launchers (Student, Farmer, Entrepreneur) */}
        <PersonaQuickSelect
          onFilterCategory={(cat) => setSelectedCategory(cat)}
        />

        {/* 3. Embedded Main Page Eligibility Assessment Engine */}
        <QuickEligibilityCard
          onSelectScheme={(schemeId) => setSelectedSchemeId(schemeId)}
        />

        {/* 4. Find Schemes Based on Categories (myScheme screenshot #2) */}
        <CategoryGrid
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />

        {/* 5. Value Beyond Existing Portals (myScheme vs GoodSchemeAI) */}
        <VsComparison />

        {/* 6. Easy Steps to Apply (How It Works 3-Step Guide) */}
        <HowItWorks />

        {/* 7. Verified Official Scheme Catalog */}
        <div id="scheme-catalog">
          <SchemeCatalog
            schemes={filteredSchemes}
            onSelectScheme={(schemeId) => setSelectedSchemeId(schemeId)}
            onOpenDocumentChecker={(scheme) => setDocumentCheckScheme(scheme)}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white">GoodSchemeAI</span>
              <p className="text-xs text-slate-500">Vernacular Citizen Government Welfare Assistant</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center max-w-md">
            Dedicated to improving scheme awareness, increasing welfare participation, and enabling inclusive citizen governance across India.
          </p>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <a href="https://myscheme.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 flex items-center gap-1">
              <span>Official myScheme Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Floating Vernacular Voice Chat Assistant Widget */}
      <VoiceChatWidget
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSelectScheme={(schemeId) => setSelectedSchemeId(schemeId)}
      />

      {/* Scheme Detail Modal */}
      <SchemeDetailModal
        scheme={activeDetailScheme}
        onClose={() => setSelectedSchemeId(null)}
      />

      {/* Missing Document Readiness Modal */}
      <DocumentReadinessModal
        scheme={documentCheckScheme}
        onClose={() => setDocumentCheckScheme(null)}
      />

      {/* Sign In & Citizen Registration Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
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
