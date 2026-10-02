# GoodBridgeScheme AI - Vernacular Government Scheme Assistant (ZABR-003)

**GoodBridgeScheme AI** is a production-grade AI platform designed to bridge awareness and accessibility gaps for government welfare programs across India. It empowers citizens to discover, assess eligibility, understand, and apply for schemes in their preferred regional language via voice and text.

---

## 🌟 Key Features

1. **Multilingual Vernacular Voice Core**:
   - Native voice synthesis & speech recognition supporting **10 Indian Regional Languages**: English, Hindi (हिन्दी), Tamil (தமிழ்), Telugu (తెలుగు), Marathi (मराठी), Bengali (বাংলা), Kannada (ಕನ್ನಡ), Gujarati (ગુજરાતી), Malayalam (മലയാളം), Punjabi (ਪੰਜਾਬੀ).
2. **Deterministic Eligibility Rule Engine**:
   - Evaluates citizen profile parameters (Age, Income, Gender, State, Occupation, Category, Landholding, Disability, BPL) to calculate a **0-100% eligibility match score** with criterion-by-criterion status.
3. **Grounded Gemini RAG Assistant**:
   - Powered by Google Gemini API (`@google/genai`), grounded on a curated catalogue of central schemes sourced from official scheme portals, with conversation memory and automatic model fallback.
4. **Document Readiness & Missing Paper Detector**:
   - Analyzes document availability before application submission, flagging missing papers in advance.
5. **Pre-Filled Regional Draft Generator**:
   - Auto-populates application previews ready for printing or offline CSC / Jan Seva Kendra submission.
6. **myScheme Inspired Landing Page**:
   - Sun ☀️ / Moon 🌙 Dark & Light theme switcher in the header.
   - Embedded main page eligibility checker wizard.
   - "Find schemes based on categories" grid (Student: 25, Agriculture: 20, MSME: 20, Women: 15, Senior: 10, Skill: 10).
   - 3-step guided roadmap & Student, Farmer, Entrepreneur persona quick-launchers.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18 + TypeScript + Tailwind CSS (Vite setup) |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | MongoDB Atlas (Mongoose ORM) + Local Fallback Store |
| **Recommendation Engine** | Custom TypeScript Rule Engine |
| **AI & RAG** | Google Gemini API (`@google/genai`) |
| **Voice Engine** | Browser Web Speech API (`SpeechSynthesis` & `SpeechRecognition`) |

---

## 📁 Directory Architecture

```
GoodBridgeScheme AI/
├── client/                          # React + TypeScript + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/              # UI components (Navbar, Hero, QuickEligibilityCard, CategoryGrid, VoiceChatWidget)
│   │   ├── context/                 # ThemeContext, LanguageContext, ProfileContext
│   │   ├── services/                # apiService, speechService
│   │   ├── utils/                   # vernacularDictionary
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── server/                          # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/                  # database.ts, gemini.ts
│   │   ├── controllers/             # schemeController, recommendationController, aiController, authController
│   │   ├── middleware/              # authMiddleware.ts, errorHandler.ts
│   │   ├── models/                  # Scheme.ts, UserProfile.ts
│   │   ├── routes/                  # schemeRoutes, recommendationRoutes, aiRoutes, authRoutes
│   │   ├── services/                # ruleEngineService.ts, ragService.ts, geminiAiService.ts, documentCheckService.ts
│   │   ├── scripts/                 # seedSchemes.ts (scheme dataset seeder)
│   │   └── index.ts
│   ├── tsconfig.json
│   └── package.json
│
└── shared/                          # Shared TypeScript Types & Contracts
    └── types.ts
```

---

## 🚀 How to Run Locally

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure Environment Variables
Copy `.env.example` in `server/` to `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/goodscheme_db
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=goodscheme_jwt_secret_hackathon_2026
```

### 3. Start Development Servers
Start Backend API Server (Port 5000):
```bash
npm run dev:server
```

Start Frontend Dev Server (Port 3000):
```bash
npm run dev:client
```

Open browser at `http://localhost:3000`.

---

## 🌐 Deployment Instructions

- **Frontend (Vercel)**:
  - Root directory: `client`
  - Build command: `npm run build`
  - Output directory: `dist`
- **Backend (Render)**:
  - Root directory: `server`
  - Build command: `npm run build`
  - Start command: `npm start`
