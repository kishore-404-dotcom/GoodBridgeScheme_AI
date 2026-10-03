# GoodBridgeScheme AI: Vernacular Government Scheme Assistant (ZABR-003)

**GoodBridgeScheme AI** helps Indian citizens **discover, understand and prepare to apply for government schemes in their own language**. It covers 508 central and state schemes taken from **myScheme**, the Government of India's official scheme platform. Citizens can search, check their eligibility and document readiness in six simple steps, and ask an AI assistant by text or voice in 10 Indian languages. When ready, they are guided to the **official** application portal, or to the offline steps when a scheme has no online application.

> ⚠️ This is an **independent** project. It is **not** an official Government of India website. Always apply on the official scheme portal linked from each scheme.

---

## Problem statement

Awareness and accessibility gaps stop many eligible citizens from benefiting from welfare schemes. Information is spread across many portals, mostly in English, and eligibility rules are hard to follow.

| Expected solution | How GoodBridgeScheme AI delivers it |
| :--- | :--- |
| **Scheme recommendation engine** | Search with filters (category, level, state, gender, social category), plus ranked recommendations from the eligibility rule engine |
| **Multilingual conversational assistant** | Gemini-powered chat in 10 languages, grounded on the official scheme data, with conversation memory, voice input and voice output |
| **Eligibility assessment module** | A 6-step guided assessment (role → location → personal details → eligibility → interests → documents) checked by a **deterministic rule engine**, with an overall match %, "why you match", "what's missing", missing documents and a PDF report |
| **Application guidance platform** | Each scheme page has benefits, eligibility, exclusions, step-by-step application process, a document checklist, a **checked** official application link with a "before you go" guide, and a "View on myScheme" source link |

---

## Features

- **myScheme-style website**: home page with search and categories, a schemes page with filter sidebar, and scheme pages with tabs (Details, Benefits, Eligibility, Application Process, Documents Required).
- **Guided eligibility assessment**: welcome screen with a privacy promise, 6 steps, analysis screen, then a report with match percentage, reasons, missing conditions, benefits, documents, apply guidance and a printable PDF (browser *Print → Save as PDF*). Answers stay on the device (localStorage).
- **Document check**: in the last step the citizen ticks which of 15 common documents they hold (Aadhaar, bank account, income/caste/residence certificates, ration card, land records …). Nothing is uploaded. Each scheme's official document list is matched to these types by a deterministic classifier (`shared/documents.ts`), and the report shows per scheme:
  - **Overall match = 70% eligibility + 30% documents ready**, with the split shown;
  - documents ready and **missing ("get these before applying")**; scheme-specific documents as "also prepare"; "if applicable" documents not counted;
  - a **"Documents to get"** panel ranking missing documents by how many of the citizen's schemes need them.
- **Apply guidance with checked links**: the apply link comes from myScheme's official application-process data and every link was tested to load. Dead links, error pages and hijacked domains were removed. Buttons say what the link is (*Apply online*, *Go to official portal*, *Download application form*); clicking shows a short guide (what to choose on the portal and the official steps). Schemes without an online application show **Apply offline** with the official steps.
- **AI assistant**: answers in the citizen's language using only the scheme data. When the citizen has completed the assessment, the rule engine's verdicts are passed to the AI, so the **AI explains but never decides** eligibility. The chat window can be moved and resized, and **Clear chat** starts a fresh conversation.
- **Citizen feedback** (with MongoDB): "Was this helpful?" and "Report wrong information" on every scheme page. Messages are only readable through an admin token.
- **Voice**: speech input through the browser. Answers and scheme pages are read aloud with the browser's voice when it has one for the language (usually English and Hindi); otherwise the server generates the speech with Gemini text-to-speech.
- **Translated scheme content**: scheme names, descriptions, benefits, eligibility, documents and steps are translated on demand from the official English text with AI, cached, and clearly marked, with a one-click "Show original (English)".
- **10 languages**: English, Hindi, Tamil, Telugu, Marathi, Bengali, Kannada, Gujarati, Malayalam and Punjabi, with a light/dark theme.

---

## Data: source and verification

- **Source**: [myScheme](https://www.myscheme.gov.in), run by the National e-Governance Division, Ministry of Electronics & IT, Government of India. Data was read from the same official API Setu endpoints the myScheme website uses. myScheme's `robots.txt` allows automated access.
- **Coverage**: **508 schemes**: 168 central and 340 state schemes from 24 states/UTs, in 6 categories. State records link to the state departments' own documents.
- **Official vs derived**:
  - *Official text, reproduced as published*: name, ministry/department, description, benefits, eligibility, exclusions, documents, application steps and references.
  - *Derived for the eligibility checker*: structured rules (age, income, gender, category, occupation, state, education, BPL, disability, minority) and a short benefit summary. These were extracted from the official text with Gemini under strict "explicit conditions only" instructions, then validated against fixed vocabularies. Conditions the checker cannot verify (e.g. "must be pregnant") are shown as **"Confirm before applying"**.
- **Quality checks**:
  - Closed schemes were excluded.
  - Schemes only for organisations, and honours/awards, were excluded.
  - A sample of records was cross-checked field by field against the live myScheme pages.
  - Rules found to be wrong on review were corrected by hand.
- **Attribution**: myScheme's [Copyright Policy](https://www.myscheme.gov.in/copyright-policy) permits reproduction free of charge if reproduced accurately with the source prominently acknowledged. Every scheme page links to its myScheme source.
- **Known limitations**:
  - 508 of myScheme's 5,000+ schemes are included.
  - Ayushman Bharat PM-JAY is not included, because its official record could not be retrieved.
  - Official scheme text is in English; other languages are AI translations of it (marked as such, with the original one click away).
  - Information was last checked on 03 Oct 2026; always confirm on the official site.

---

## Tech stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18 + TypeScript + Tailwind CSS (Vite) |
| **Backend** | Node.js + Express + TypeScript |
| **Eligibility** | Deterministic TypeScript rule engine (`server/src/services/ruleEngineService.ts`) |
| **AI** | Google Gemini API (`@google/genai`), grounded on a relevant subset of schemes per question, with model fallback |
| **Voice** | Browser Web Speech API (`SpeechRecognition` & `SpeechSynthesis`) |
| **Database** | MongoDB Atlas (Mongoose): scheme catalog, translations, citizen feedback and anonymous daily usage counts. Optional: without it the server uses the built-in data and translation file |
| **Deployment** | Frontend on **Vercel**, backend on **Render** |

---

## Project structure

```
GoodBridgeScheme_AI/
├── client/                         # React website (Vercel)
│   └── src/
│       ├── pages/                  # SchemesPage, SchemeDetailPage
│       ├── components/             # Navbar, HeroBanner, CategoryGrid, HowItWorks, EligibilityAssessment,
│       │                           # EligibilityReport, VoiceChatWidget, ApplyButton, SchemeFeedback
│       ├── context/                # Theme, Language, Profile
│       ├── hooks/                  # useHashRoute (#/ pages), useSiteText, useSchemeTranslations, useFloatingPanel
│       ├── services/               # apiService, speechService
│       └── utils/                  # vernacularDictionary, siteStrings (UI text in 10 languages), applyLink, storage
├── server/                         # Express API (Render)
│   ├── data/translations.json      # Cached scheme translations (also synced to MongoDB)
│   └── src/
│       ├── controllers/ routes/    # schemes, recommendations, AI chat/translate/voice, feedback & stats
│       ├── services/               # ruleEngineService, geminiAiService, ragService, schemeStore,
│       │                           # translationService, ttsService, statsService
│       ├── models/                 # Scheme, Translation, Feedback, UsageStat (MongoDB)
│       ├── middleware/             # rateLimit, adminOnly
│       └── config/                 # gemini.ts, modelHealth.ts, database.ts
└── shared/                         # Used by both client and server
    ├── types.ts                    # Scheme, EligibilityRules, UserProfile …
    ├── eligibilityOptions.ts       # Roles, income bands, education levels, states, interests
    ├── documents.ts                # Document types, classifier and readiness score
    └── seedSchemes.ts              # The 508 official schemes (generated)
```

---

## Run locally

**Requirements:** Node.js 18+ and a [Gemini API key](https://aistudio.google.com).

```bash
npm run install:all
```

Create `server/.env` from `server/.env.example`:

```
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
# Optional
GEMINI_MODEL=gemini-flash-latest
GEMINI_FALLBACK_MODELS=gemini-flash-lite-latest
MONGODB_URI=
MONGODB_DB=goodbridge
ADMIN_TOKEN=
```

With `MONGODB_URI` set, the server copies the 508 schemes and the cached translations into the database on start; feedback and usage counts are stored as people use the site. Without it, everything except feedback and stats still works.

Start the backend and frontend, each in its own terminal:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

Open **http://localhost:3000**. The frontend sends `/api` requests to the backend on port 5000.

---

## Deployment (Vercel + Render)

Deploy the **backend first**, because the frontend needs its URL.

### Backend: Render (Web Service)

| Setting | Value |
| :--- | :--- |
| Root Directory | `server` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` (runs `node dist/server/src/index.js`) |

| Environment variable | Required | Value |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | ✅ | Your Gemini API key |
| `NODE_ENV` | Recommended | `production` |
| `GEMINI_MODEL` | Optional | `gemini-flash-latest` |
| `GEMINI_FALLBACK_MODELS` | Optional | `gemini-flash-lite-latest` |
| `MONGODB_URI` | Recommended | MongoDB Atlas connection string. Needed for feedback, usage stats and translations that survive restarts |
| `MONGODB_DB` | Optional | Database name (default `goodbridge`) |
| `JWT_SECRET` | Recommended | Any long random text |
| `ADMIN_TOKEN` | Optional | Long random text; enables `GET /api/feedback/summary` with `Authorization: Bearer <token>` |

In MongoDB Atlas, allow access from anywhere (`0.0.0.0/0`) under **Network Access**, because Render's addresses change. Render sets `PORT` automatically. Free instances sleep after about 15 minutes idle and take 30–50 s to wake, so open the site a few minutes before a demo.

### Frontend: Vercel

| Setting | Value |
| :--- | :--- |
| Root Directory | `client` |
| Framework Preset | Vite |
| Build Command / Output | `npm run build` / `dist` |

| Environment variable | Required | Value |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | ✅ | `https://<your-render-service>.onrender.com/api` |

> 🔒 Never put the Gemini key in a `VITE_` variable. Those values are built into the public website.

The client and server both import from `shared/`, so keep the full repository connected; don't deploy the folders on their own. Page routes use `#/…`, so Vercel needs no rewrite rules.

---

## Voice support

Voice input and read-aloud use the browser's Web Speech API.
- **Voice input** works in Chrome and Edge for the supported Indian languages (internet required).
- **Read-aloud** uses the device's voice when one exists for the language; otherwise the backend generates the audio (`POST /api/ai/tts`, Gemini text-to-speech), so all 10 languages can be heard on any browser.

---

## License and credits

- **Code**: [MIT License](LICENSE) © 2026 kishore-404-dotcom.
- **Scheme data**: © Government of India, from [myScheme](https://www.myscheme.gov.in) and the state departments it publishes for, reproduced under myScheme's copyright policy with acknowledgement. The MIT license does not apply to this data.
- **AI**: Google Gemini powers the assistant and was used to derive eligibility rules from official text. The project was built with AI-assisted development (Claude Code).
