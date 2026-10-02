import { Type } from '@google/genai';
import { aiClient, GEMINI_MODEL, GEMINI_FALLBACK_MODELS, GEMINI_TIMEOUT_MS } from '../config/gemini';
import { RAGService } from './ragService';
import { RuleEngineService } from './ruleEngineService';
import { Scheme, ChatHistoryTurn, UserProfile } from '../../../shared/types';

const MAX_HISTORY_TURNS = 10;

/** Fallback labels so the offline answer still matches the citizen's language */
const FALLBACK_LABELS: Record<string, { scheme: string; benefit: string; summary: string; docs: string; portal: string; askProfile: string }> = {
  English: { scheme: 'Recommended Scheme', benefit: 'Financial Benefit', summary: 'Summary', docs: 'Required Documents', portal: 'Official Portal', askProfile: 'Please tell me your age, state, occupation and annual income so I can find the right schemes for you.' },
  Hindi: { scheme: 'सुझाई गई योजना', benefit: 'आर्थिक लाभ', summary: 'सारांश', docs: 'आवश्यक दस्तावेज़', portal: 'आधिकारिक पोर्टल', askProfile: 'कृपया अपनी उम्र, राज्य, व्यवसाय और वार्षिक आय बताएं ताकि मैं आपके लिए सही योजनाएं ढूंढ सकूं।' },
  Tamil: { scheme: 'பரிந்துரைக்கப்பட்ட திட்டம்', benefit: 'நிதி பலன்', summary: 'சுருக்கம்', docs: 'தேவையான ஆவணங்கள்', portal: 'அதிகாரப்பூர்வ இணையதளம்', askProfile: 'உங்களுக்கு ஏற்ற திட்டங்களைக் கண்டறிய உங்கள் வயது, மாநிலம், தொழில் மற்றும் ஆண்டு வருமானத்தைக் கூறுங்கள்.' },
  Telugu: { scheme: 'సిఫార్సు చేసిన పథకం', benefit: 'ఆర్థిక ప్రయోజనం', summary: 'సారాంశం', docs: 'అవసరమైన పత్రాలు', portal: 'అధికారిక పోర్టల్', askProfile: 'మీకు సరైన పథకాలను కనుగొనడానికి మీ వయస్సు, రాష్ట్రం, వృత్తి మరియు వార్షిక ఆదాయాన్ని చెప్పండి.' },
  Marathi: { scheme: 'शिफारस केलेली योजना', benefit: 'आर्थिक लाभ', summary: 'सारांश', docs: 'आवश्यक कागदपत्रे', portal: 'अधिकृत पोर्टल', askProfile: 'तुमच्यासाठी योग्य योजना शोधण्यासाठी कृपया तुमचे वय, राज्य, व्यवसाय आणि वार्षिक उत्पन्न सांगा.' },
  Bengali: { scheme: 'প্রস্তাবিত প্রকল্প', benefit: 'আর্থিক সুবিধা', summary: 'সারসংক্ষেপ', docs: 'প্রয়োজনীয় নথি', portal: 'সরকারি পোর্টাল', askProfile: 'আপনার জন্য সঠিক প্রকল্প খুঁজতে অনুগ্রহ করে আপনার বয়স, রাজ্য, পেশা এবং বার্ষিক আয় জানান।' },
  Kannada: { scheme: 'ಶಿಫಾರಸು ಮಾಡಿದ ಯೋಜನೆ', benefit: 'ಆರ್ಥಿಕ ಪ್ರಯೋಜನ', summary: 'ಸಾರಾಂಶ', docs: 'ಅಗತ್ಯ ದಾಖಲೆಗಳು', portal: 'ಅಧಿಕೃತ ಪೋರ್ಟಲ್', askProfile: 'ನಿಮಗೆ ಸೂಕ್ತ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ವಯಸ್ಸು, ರಾಜ್ಯ, ಉದ್ಯೋಗ ಮತ್ತು ವಾರ್ಷಿಕ ಆದಾಯವನ್ನು ತಿಳಿಸಿ.' },
  Gujarati: { scheme: 'ભલામણ કરેલ યોજના', benefit: 'આર્થિક લાભ', summary: 'સારાંશ', docs: 'જરૂરી દસ્તાવેજો', portal: 'સત્તાવાર પોર્ટલ', askProfile: 'તમારા માટે યોગ્ય યોજનાઓ શોધવા કૃપા કરીને તમારી ઉંમર, રાજ્ય, વ્યવસાય અને વાર્ષિક આવક જણાવો.' },
  Malayalam: { scheme: 'ശുപാർശ ചെയ്ത പദ്ധതി', benefit: 'സാമ്പത്തിക ആനുകൂല്യം', summary: 'സംഗ്രഹം', docs: 'ആവശ്യമായ രേഖകൾ', portal: 'ഔദ്യോഗിക പോർട്ടൽ', askProfile: 'നിങ്ങൾക്ക് അനുയോജ്യമായ പദ്ധതികൾ കണ്ടെത്താൻ ദയവായി നിങ്ങളുടെ പ്രായം, സംസ്ഥാനം, തൊഴിൽ, വാർഷിക വരുമാനം എന്നിവ പറയുക.' },
  Punjabi: { scheme: 'ਸਿਫ਼ਾਰਸ਼ ਕੀਤੀ ਯੋਜਨਾ', benefit: 'ਵਿੱਤੀ ਲਾਭ', summary: 'ਸਾਰ', docs: 'ਲੋੜੀਂਦੇ ਦਸਤਾਵੇਜ਼', portal: 'ਅਧਿਕਾਰਤ ਪੋਰਟਲ', askProfile: 'ਤੁਹਾਡੇ ਲਈ ਸਹੀ ਯੋਜਨਾਵਾਂ ਲੱਭਣ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਉਮਰ, ਰਾਜ, ਕਿੱਤਾ ਅਤੇ ਸਾਲਾਨਾ ਆਮਦਨ ਦੱਸੋ।' }
};

/**
 * Multilingual Gemini AI Service
 * Generates grounded scheme guidance in the citizen's preferred regional language,
 * remembering earlier turns of the conversation.
 */
export class GeminiAiService {
  public static async generateVernacularAnswer(
    userMessage: string,
    language: string,
    allSchemes: Scheme[],
    history: ChatHistoryTurn[] = [],
    profile?: UserProfile
  ): Promise<{ responseText: string; relevantSchemes: Scheme[] }> {
    if (aiClient) {
      try {
        return await this.askGemini(userMessage, language, allSchemes, history, profile);
      } catch (err) {
        console.error('Gemini API call failed, using grounded fallback:', (err as Error).message);
      }
    }

    // Local fallback: keyword retrieval + template answer in the requested language
    const relevantSchemes = RAGService.retrieveRelevantSchemes(userMessage, allSchemes, 3);
    return { responseText: this.getFallbackAnswer(language, relevantSchemes), relevantSchemes };
  }

  private static async askGemini(
    userMessage: string,
    language: string,
    allSchemes: Scheme[],
    history: ChatHistoryTurn[],
    profile?: UserProfile
  ): Promise<{ responseText: string; relevantSchemes: Scheme[] }> {
    // The catalogue is small enough to ground on in full, which also lets Gemini
    // match questions asked in any Indian language (keyword search only handles English).
    const groundingContext = RAGService.buildGroundingContext(allSchemes);

    const systemInstruction = `You are GoodBridgeScheme AI, an independent, trustworthy assistant that helps Indian citizens understand government schemes. You are not an official government service.

Always reply in ${language}, using simple, friendly words a first-time user can understand. Keep scheme names recognisable (you may add the English name in brackets).

Base every fact strictly on the scheme catalogue below. Never invent schemes, amounts, eligibility rules or URLs. If no scheme fits, say so honestly.

If you need details to judge eligibility (age, state, occupation, annual income, gender, social category, BPL status), ask the citizen one or two short follow-up questions instead of guessing.

When recommending schemes, mention the benefit (₹), the key eligibility rules, the documents needed and how to apply. Use short bullet points.

--- SCHEME CATALOGUE ---
${groundingContext}
------------------------
${profile ? this.buildProfileContext(profile, allSchemes) : ''}`;

    const contents = [
      ...history.slice(-MAX_HISTORY_TURNS).map((turn) => ({
        role: turn.sender === 'user' ? 'user' : 'model',
        parts: [{ text: turn.text }]
      })),
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    const request = {
      contents,
      config: {
        httpOptions: { timeout: GEMINI_TIMEOUT_MS },
        systemInstruction,
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING, description: `The reply to the citizen, written in ${language}` },
            schemeIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'IDs (e.g. SCH-001) of the schemes recommended in the answer, most relevant first. Empty if none.'
            }
          },
          required: ['answer', 'schemeIds']
        }
      }
    };

    let response;
    let lastError: unknown;
    for (const model of [GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS]) {
      try {
        response = await aiClient!.models.generateContent({ model, ...request });
        break;
      } catch (err) {
        lastError = err;
        console.warn(`Gemini model ${model} failed, trying next:`, (err as Error).message.slice(0, 120));
      }
    }
    if (!response) throw lastError;

    const parsed = JSON.parse(response.text || '{}') as { answer?: string; schemeIds?: string[] };
    if (!parsed.answer) throw new Error('Empty Gemini response');

    const relevantSchemes = (parsed.schemeIds || [])
      .map((id) => allSchemes.find((s) => s.schemeId === id))
      .filter((s): s is Scheme => Boolean(s))
      .slice(0, 4);

    return { responseText: parsed.answer, relevantSchemes };
  }

  /**
   * Eligibility is decided by the deterministic rule engine, never by the LLM.
   * Gemini only receives the verdicts so it can explain them in the citizen's language.
   */
  private static buildProfileContext(profile: UserProfile, allSchemes: Scheme[]): string {
    const results = allSchemes.map((s) => RuleEngineService.evaluateSchemeEligibility(s, profile));
    const eligible = results.filter((r) => r.isEligible);
    const near = results.filter((r) => !r.isEligible && r.matchScorePercentage >= 50);

    return `
--- CITIZEN PROFILE (from the eligibility form) ---
Age: ${profile.age}, Gender: ${profile.gender}, State: ${profile.state}, Occupation: ${profile.occupation}, Annual income: ₹${profile.annualIncome}, Social category: ${profile.category}, BPL card: ${profile.isBPL ? 'Yes' : 'No'}, Disability: ${profile.hasDisability ? 'Yes' : 'No'}

--- RULE ENGINE VERDICTS (authoritative, do not contradict) ---
Eligible: ${eligible.map((r) => `${r.scheme.schemeId} ${r.scheme.name}`).join('; ') || 'none'}
Not yet eligible: ${near.map((r) => `${r.scheme.schemeId} ${r.scheme.name} (fails: ${r.criteriaFailed.map((c) => c.details).join(' ')})`).join('; ') || 'none'}

Use this profile instead of asking for details the citizen already gave. When you say whether the citizen qualifies for a scheme, follow these verdicts exactly.
---------------------------------------------------`;
  }

  private static getFallbackAnswer(language: string, schemes: Scheme[]): string {
    const labels = FALLBACK_LABELS[language] || FALLBACK_LABELS.English;

    if (schemes.length === 0) {
      return labels.askProfile;
    }

    const topScheme = schemes[0];
    return `📌 **${labels.scheme}**: ${topScheme.name} (${topScheme.category})
💰 **${labels.benefit}**: ${topScheme.financialBenefit}
📋 **${labels.summary}**: ${topScheme.summaryText}
📁 **${labels.docs}**: ${topScheme.documentsRequired.slice(0, 4).join(', ')}
🔗 **${labels.portal}**: ${topScheme.applicationUrl}`;
  }
}
