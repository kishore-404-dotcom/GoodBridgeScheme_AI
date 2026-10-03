import { Type } from '@google/genai';
import { aiClient, GEMINI_MODEL, GEMINI_FALLBACK_MODELS, GEMINI_TIMEOUT_MS } from '../config/gemini';
import { reportModelFailure, usableModels } from '../config/modelHealth';
import { RAGService } from './ragService';
import { RuleEngineService } from './ruleEngineService';
import { INDIAN_STATES } from '../../../shared/eligibilityOptions';
import { Scheme, ChatHistoryTurn, UserProfile, EligibilityEvaluationResult } from '../../../shared/types';

const MAX_HISTORY_TURNS = 10;

// The catalogue has hundreds of schemes; each request is grounded on a relevant subset only
const MAX_CONTEXT_SCHEMES = 25;
const KEYWORD_SCHEMES = 10;
const ELIGIBLE_SCHEMES = 12;
const NEAR_SCHEMES = 5;

/** True when the text is mostly in a non-Latin script (Hindi, Tamil, ...), where keyword search can't match */
const isNonLatin = (text: string) => {
  const letters = text.replace(/[^\p{L}]/gu, '');
  const latin = letters.replace(/[^A-Za-z]/g, '');
  return letters.length > 0 && latin.length / letters.length < 0.5;
};

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
    const verdicts = profile ? this.evaluateProfile(profile, allSchemes) : null;
    const contextSchemes = await this.selectContextSchemes(userMessage, allSchemes, history, profile, verdicts);
    const groundingContext = RAGService.buildGroundingContext(contextSchemes);

    const systemInstruction = `You are GoodBridgeScheme AI, an independent, trustworthy assistant that helps Indian citizens understand government schemes. You are not an official government service.

Always reply in ${language}, using simple, friendly words a first-time user can understand. Keep scheme names recognisable: in a non-English reply you may add the English name in brackets once; in an English reply write each name once, without repeating it in brackets.

Base every fact strictly on the schemes listed below: a pre-selected subset of the ${allSchemes.length} official schemes we cover. Never invent schemes, amounts, eligibility rules or URLs. If none of the listed schemes fits, say so honestly and suggest the citizen use the eligibility check on this website or rephrase the question.

Answer first, then personalise:
- Whenever any listed scheme fits the question, recommend the 3 to 5 most relevant ones straight away, even if you don't know the citizen's details yet. For each: name, benefit (₹), key eligibility and how to apply, as short bullet points.
- Only after recommending, you may ask ONE short question that would narrow the list (e.g. their state or income). Never reply with only questions, except to a bare greeting.
- If the citizen has already told you something (state, age, occupation…) in this conversation, use it and do not ask for it again.
- Do not repeat an earlier answer from this conversation. For a repeated or follow-up question, add new information or different schemes.
- Vary your wording and do not start every reply with a greeting.
- For a question about one scheme (documents, steps, benefit), answer about that scheme directly.

Never write scheme IDs (like MS-pm-kisan) in the answer text; they are internal and belong only in schemeIds.

--- RELEVANT SCHEMES ---
${groundingContext}
------------------------
${profile && verdicts ? this.buildProfileContext(profile, verdicts) : ''}`;

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
        temperature: 0.5,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING, description: `The reply to the citizen, written in ${language}` },
            schemeIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'IDs (exactly as given in the scheme list) of EVERY scheme mentioned in the answer, most relevant first. Empty only if the answer mentions no scheme.'
            }
          },
          required: ['answer', 'schemeIds']
        }
      }
    };

    let response;
    let lastError: unknown;
    for (const model of usableModels([GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS])) {
      try {
        response = await aiClient!.models.generateContent({ model, ...request });
        break;
      } catch (err) {
        reportModelFailure(model, err);
        lastError = err;
        console.warn(`Gemini model ${model} failed, trying next:`, (err as Error).message.slice(0, 120));
      }
    }
    if (!response) throw lastError;

    const parsed = JSON.parse(response.text || '{}') as { answer?: string; schemeIds?: string[] };
    if (!parsed.answer) throw new Error('Empty Gemini response');

    const byId = (parsed.schemeIds || [])
      .map((id) => contextSchemes.find((s) => s.schemeId === id))
      .filter((s): s is Scheme => Boolean(s));
    // The model sometimes names schemes without listing their ids; pick those up from the answer text
    const answerLower = parsed.answer.toLowerCase();
    const byName = contextSchemes.filter(
      (s) =>
        answerLower.includes(s.name.toLowerCase()) ||
        (s.shortTitle && s.shortTitle.length >= 4 && answerLower.includes(s.shortTitle.toLowerCase()))
    );
    const relevantSchemes = [...new Map([...byId, ...byName].map((s) => [s.schemeId, s])).values()].slice(0, 5);

    // Internal ids sometimes leak into the prose despite the instruction; strip "(MS-x)", "[MS-x]", "ID: MS-x"
    const responseText = parsed.answer
      .replace(/[ \t]*(?:[Ii][Dd]:\s*)?[[(]?\bMS-[a-z0-9]+(?:-[a-z0-9]+)*\b[\])]?/g, '')
      .replace(/[ \t]+([,.;:।])/g, '$1');

    return { responseText, relevantSchemes };
  }

  /** Rule-engine verdicts for the citizen, best matches first */
  private static evaluateProfile(profile: UserProfile, allSchemes: Scheme[]) {
    const results = allSchemes.map((s) => RuleEngineService.evaluateSchemeEligibility(s, profile));
    const byScore = (a: EligibilityEvaluationResult, b: EligibilityEvaluationResult) =>
      b.matchScorePercentage - a.matchScorePercentage || b.scheme.financialBenefitAmount - a.scheme.financialBenefitAmount;
    return {
      eligible: results.filter((r) => r.isEligible).sort(byScore).slice(0, ELIGIBLE_SCHEMES),
      near: results
        .filter((r) => !r.isEligible && r.criteriaFailed.length === 1 && r.criteriaFailed[0].criterion !== 'Occupation')
        .sort(byScore)
        .slice(0, NEAR_SCHEMES)
    };
  }

  /**
   * Picks the schemes Gemini sees: keyword matches for the question (and the previous turn,
   * so follow-ups like "that one" resolve), then the citizen's eligible and almost-eligible schemes.
   */
  private static async selectContextSchemes(
    userMessage: string,
    allSchemes: Scheme[],
    history: ChatHistoryTurn[],
    profile?: UserProfile,
    verdicts?: { eligible: EligibilityEvaluationResult[]; near: EligibilityEvaluationResult[] } | null
  ): Promise<Scheme[]> {
    const lastAssistant = [...history].reverse().find((t) => t.sender === 'assistant')?.text || '';
    const lastUser = [...history].reverse().find((t) => t.sender === 'user')?.text || '';
    const question = isNonLatin(userMessage)
      ? await this.toEnglishSearchQuery(`${lastUser}\n${userMessage}`)
      : `${lastUser} ${userMessage}`;
    // A state named in the question wins over the profile, so other states' schemes don't crowd it out
    const mentionedState = INDIAN_STATES.find((st) => question.toLowerCase().includes(st.toLowerCase()));
    const state = mentionedState || profile?.state || undefined;

    const picked = [
      ...RAGService.retrieveRelevantSchemes(question, allSchemes, KEYWORD_SCHEMES, { state }),
      // Scheme names mentioned in the previous answer
      ...RAGService.retrieveRelevantSchemes(lastAssistant.slice(0, 1500), allSchemes, 3, { state }),
      ...(verdicts?.eligible.map((r) => r.scheme) || []),
      ...(verdicts?.near.map((r) => r.scheme) || [])
    ];

    const unique = [...new Map(picked.map((s) => [s.schemeId, s])).values()].slice(0, MAX_CONTEXT_SCHEMES);
    // Never ground on nothing: fall back to the state's and the flagship central schemes
    if (unique.length === 0) unique.push(...RAGService.defaultSchemes(allSchemes, 15, state));
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Chat grounding: ${unique.length} of ${allSchemes.length} schemes (search: "${question.slice(0, 80)}")`);
    }
    return unique;
  }

  /** Short English keyword query for non-English questions, so keyword retrieval can work */
  private static async toEnglishSearchQuery(text: string): Promise<string> {
    if (!aiClient) return text;
    for (const model of usableModels([...GEMINI_FALLBACK_MODELS, GEMINI_MODEL])) {
      try {
        const res = await aiClient.models.generateContent({
          model,
          contents: text,
          config: {
            httpOptions: { timeout: GEMINI_TIMEOUT_MS },
            temperature: 0,
            maxOutputTokens: 60,
            systemInstruction:
              'Translate this question from an Indian citizen about government schemes into a short English keyword search query: beneficiary type, benefit type, scheme names and state if mentioned. Reply with the keywords only.'
          }
        });
        if (res.text?.trim()) return res.text.trim();
      } catch (err) {
        reportModelFailure(model, err);
        console.warn(`Query translation with ${model} failed:`, (err as Error).message.slice(0, 120));
      }
    }
    return text;
  }

  /**
   * Eligibility is decided by the deterministic rule engine, never by the LLM.
   * Gemini only receives the verdicts so it can explain them in the citizen's language.
   */
  private static buildProfileContext(
    profile: UserProfile,
    { eligible, near }: { eligible: EligibilityEvaluationResult[]; near: EligibilityEvaluationResult[] }
  ): string {

    return `
--- CITIZEN PROFILE (from the eligibility form) ---
Age: ${profile.age}, Gender: ${profile.gender}, State: ${profile.state}, Occupation: ${profile.occupation}, Annual income: ₹${profile.annualIncome}, Social category: ${profile.category}, BPL card: ${profile.isBPL ? 'Yes' : 'No'}, Disability: ${profile.hasDisability ? 'Yes' : 'No'}${profile.district ? `, District: ${profile.district}` : ''}${profile.education ? `, Education: ${profile.education}` : ''}${profile.isMinority ? ', Minority community: Yes' : ''}${profile.interests?.length ? `, Looking for: ${profile.interests.join(', ')}` : ''}

--- RULE ENGINE VERDICTS (authoritative, do not contradict) ---
Eligible (top matches): ${eligible.map((r) => `${r.scheme.schemeId} ${r.scheme.name}${r.criteriaMet.some((c) => c.criterion === 'To confirm') ? ' [has extra conditions to confirm]' : ''}`).join('; ') || 'none'}
Not yet eligible: ${near.map((r) => `${r.scheme.schemeId} ${r.scheme.name} (fails: ${r.criteriaFailed.map((c) => c.details).join(' ')})`).join('; ') || 'none'}
Schemes not listed here were not checked for this conversation; do not claim eligibility for them.

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
