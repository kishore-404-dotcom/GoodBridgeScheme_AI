export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  speechCode: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', speechCode: 'en-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', speechCode: 'hi-IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', speechCode: 'ta-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', speechCode: 'te-IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', speechCode: 'mr-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', speechCode: 'bn-IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', speechCode: 'kn-IN' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', speechCode: 'gu-IN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', speechCode: 'ml-IN' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', speechCode: 'pa-IN' }
];

export const UI_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    heroTitle: 'Simplifying Every Citizen’s Journey to Government Welfare Schemes',
    heroSubtitle: 'Discover, check eligibility, and apply for central & state schemes in your regional language with AI voice assistance.',
    searchPlaceholder: 'Enter scheme name or speak in your language...',
    checkEligibilityBtn: '⚡ Check Your Eligibility',
    askVoiceBtn: '🎙️ Speak with Voice AI',
    findCategoriesTitle: 'Find Schemes Based on Categories',
    howItWorksTitle: 'Easy Steps to Apply for Government Schemes',
    step1Title: '1. Enter Details',
    step1Desc: 'Fill your basic profile details or tell your voice assistant.',
    step2Title: '2. AI Match & Search',
    step2Desc: 'Our rule engine & AI search finds your exact eligible schemes.',
    step3Title: '3. Select & Apply',
    step3Desc: 'Get document checklist, pre-filled application draft, and apply.',
    signInBtn: 'Sign In →',
    verifiedBadge: '100% Verified Official myScheme Data',
    matchScore: 'Eligibility Match',
    financialBenefit: 'Financial Benefit',
    requiredDocs: 'Required Documents',
    readAloudBtn: '🔊 Listen in Voice',
    applyNowBtn: 'Apply on Official Portal 🔗',
    checkDocsBtn: '📋 Check Document Readiness',
    vsTitle: 'Why GoodSchemeAI vs Existing Portals',
    studentPersona: 'Student',
    farmerPersona: 'Farmer',
    entrepreneurPersona: 'Entrepreneur / MSME'
  },
  hi: {
    heroTitle: 'सरकारी कल्याणकारी योजनाओं तक हर नागरिक की यात्रा को सरल बनाना',
    heroSubtitle: 'अपनी क्षेत्रीय भाषा में AI आवाज सहायता के साथ केंद्रीय और राज्य योजनाओं की खोज करें, पात्रता जांचें और आवेदन करें।',
    searchPlaceholder: 'योजना का नाम खोजें या अपनी भाषा में बोलें...',
    checkEligibilityBtn: '⚡ अपनी पात्रता जांचें',
    askVoiceBtn: '🎙️ वॉइस AI से बात करें',
    findCategoriesTitle: 'श्रेणियों के आधार पर योजनाएं खोजें',
    howItWorksTitle: 'सरकारी योजनाओं के लिए आवेदन करने के आसान चरण',
    step1Title: '1. विवरण दर्ज करें',
    step1Desc: 'अपनी बुनियादी जानकारी भरें या अपने वॉइस असिस्टेंट को बताएं।',
    step2Title: '2. AI मैच और खोज',
    step2Desc: 'हमारा इंजन आपकी सटीक पात्र योजनाओं को ढूंढता है।',
    step3Title: '3. चुनें और आवेदन करें',
    step3Desc: 'दस्तावेज़ चेकलिस्ट, ड्राफ्ट प्राप्त करें और आवेदन करें।',
    signInBtn: 'साइन इन →',
    verifiedBadge: '100% सत्यापित आधिकारिक योजना डेटा',
    matchScore: 'पात्रता मैच',
    financialBenefit: 'वित्तीय लाभ',
    requiredDocs: 'आवश्यक दस्तावेज',
    readAloudBtn: '🔊 आवाज में सुनें',
    applyNowBtn: 'आधिकारिक पोर्टल पर आवेदन करें 🔗',
    checkDocsBtn: '📋 दस्तावेज़ तत्परता जांचें',
    vsTitle: 'GoodSchemeAI क्यों पारंपरिक पोर्टलों से बेहतर है',
    studentPersona: 'छात्र',
    farmerPersona: 'किसान',
    entrepreneurPersona: 'उद्यमी / एमएसएमई'
  },
  ta: {
    heroTitle: 'அரசு திட்டங்களை ஒவ்வொரு குடிமகனுக்கும் எளிதாக்குகிறது',
    heroSubtitle: 'உங்கள் தாய்மொழியில் AI குரல் உதவியுடன் மத்திய மற்றும் மாநில நலத்திட்டங்களை கண்டறியவும்.',
    searchPlaceholder: 'திட்டத்தின் பெயரை தட்டச்சு செய்யவும் அல்லது பேசுங்கள்...',
    checkEligibilityBtn: '⚡ தகுதியை சரிபார்க்கவும்',
    askVoiceBtn: '🎙️ குரல் AI உடன் பேசுங்கள்',
    findCategoriesTitle: 'பிரிவுகளின் அடிப்படையில் திட்டங்களை தேடவும்',
    howItWorksTitle: 'அரசு திட்டங்களுக்கு விண்ணப்பிக்க எளிதான வழிகள்',
    step1Title: '1. விவரங்களை உள்ளிடவும்',
    step1Desc: 'உங்கள் தகவல்களை நிரப்பவும்.',
    step2Title: '2. AI தேடல்',
    step2Desc: 'உங்களுக்கான சரியான திட்டங்களை AI கண்டறியும்.',
    step3Title: '3. தேர்வு செய்து விண்ணப்பிக்கவும்',
    step3Desc: 'ஆவண சரிபார்ப்பு பட்டியல் பெற்று விண்ணப்பிக்கவும்.',
    signInBtn: 'உள்நுழைய →',
    verifiedBadge: '100% சரிபார்க்கப்பட்ட அரசு தரவு',
    matchScore: 'தகுதி சதவீதம்',
    financialBenefit: 'நிதி நன்மை',
    requiredDocs: 'தேவையான ஆவணங்கள்',
    readAloudBtn: '🔊 குரலில் கேட்க',
    applyNowBtn: 'விண்ணப்பிக்க 🔗',
    checkDocsBtn: '📋 ஆவணங்கள் சரிபார்க்க',
    vsTitle: 'GoodSchemeAI ஏன் சிறந்தது',
    studentPersona: 'மாணவர்',
    farmerPersona: 'விவசாயி',
    entrepreneurPersona: 'தொழில்முனைவோர்'
  },
  te: {
    heroTitle: 'ప్రభుత్వ సంక్షేమ పథకాలను ప్రతి పౌరుడికి సులభతరం చేయడం',
    heroSubtitle: 'మీ ప్రాంతీయ భాషలో AI వాయిస్ సహాయంతో కేంద్ర మరియు రాష్ట్ర పథకాలను కనుగొనండి.',
    searchPlaceholder: 'పథకం పేరు నమోదు చేయండి లేదా మాట్లాడండి...',
    checkEligibilityBtn: '⚡ అర్హతను తనిఖీ చేయండి',
    askVoiceBtn: '🎙️ వాయిస్ AI తో మాట్లాడండి',
    findCategoriesTitle: 'వర్గాల ఆధారంగా పథకాలను కనుగొనండి',
    howItWorksTitle: 'అప్లై చేయడానికి సులభమైన దశలు',
    step1Title: '1. వివరాలు నమోదు చేయండి',
    step1Desc: 'మీ సమాచారాన్ని పూరించండి.',
    step2Title: '2. AI శోధన',
    step2Desc: 'మీకు అర్హత ఉన్న పథకాలను కనుగొంటుంది.',
    step3Title: '3. ఎంచుకుని దరఖాస్తు చేయండి',
    step3Desc: 'పత్రాల జాబితా పొంది దరఖాస్తు చేయండి.',
    signInBtn: 'సైన్ ఇన్ →',
    verifiedBadge: '100% ధృవీకరించబడిన ప్రభుత్వ డేటా',
    matchScore: 'అర్హత మ్యాచ్',
    financialBenefit: 'ఆర్థిక ప్రయోజనం',
    requiredDocs: 'అవసరమైన పత్రాలు',
    readAloudBtn: '🔊 వాయిస్‌లో వినండి',
    applyNowBtn: 'అధికారిక పోర్టల్‌లో అప్లై చేయండి 🔗',
    checkDocsBtn: '📋 పత్రాలను తనిఖీ చేయండి',
    vsTitle: 'GoodSchemeAI ప్రత్యేకత',
    studentPersona: 'విద్యార్థి',
    farmerPersona: 'రైతు',
    entrepreneurPersona: 'పారిశ్రామికవేత్త'
  }
};

export const getTranslation = (langCode: string, key: string): string => {
  const langDict = UI_TRANSLATIONS[langCode] || UI_TRANSLATIONS['en'];
  return langDict[key] || UI_TRANSLATIONS['en'][key] || key;
};
