import { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

/*
  ECHO.11 v8 — Bilingual Prompt Optimizer (EN / HE)
  ==================================================
  Language system:
  - Default: English (EN)
  - Auto-detect: if browser is set to Hebrew → switch to HE
  - User preference persisted in localStorage
  - Toggle button in Header switches between EN ↔ HE
  - RTL automatically applied when HE is active
  - All UI strings centralized in TRANSLATIONS object below

  Methodology:
  - Google Prompt Engineering Whitepaper (2025, 68pp, Kaggle)
  - Anthropic Claude Best Practices (docs.anthropic.com)
  - 10 criteria mapped to verified PE principles
*/


// ═══════════════════════════════════════════════════════════════
// TRANSLATIONS — Edit here to update any UI text (EN and HE)
// Functions handle dynamic values (counts, labels, etc.)
// ═══════════════════════════════════════════════════════════════

const TRANSLATIONS = {
  en: {
    dir: "ltr",
    htmlLang: "en",

    // Score labels (index 0 unused)
    scoreLabels: ["", "Weak", "Basic", "Fair", "Decent", "Average", "Good", "Great", "Excellent", "Expert", "Perfect"],
    tierLabels: ["", "Basic", "Enhanced", "Pro"],

    // Splash screen
    splashSkip: "Skip to entry",
    splashHeadline: ["Every prompt can be", "better"],
    splashSub: "Find out how.",
    splashCTA: "Get Started →",

    // Header
    appSub: "prompt engine",
    skipMain: "Skip to main tool",
    freeCount: (n) => `${n} free`,
    proLabel: "Pro",
    streakLabel: (n) => `${n} streak`,
    historyBtn: (n) => `History ${n}`,
    shrinkText: "Decrease text size",
    growText: "Increase text size",
    toggleLangBtn: "HE", // label shown when current lang is EN

    // Hero
    heroH1: ["Your Prompt,", "Amplified"],
    heroSub: "A free tool to optimize any prompt — for use with any AI",

    // Methodology & accessibility panel
    methodBtn: "ⓘ Methodology & Accessibility",
    methodTitle: "Scoring Methodology — 10 Criteria",
    methodBody: "Based on the Google Prompt Engineering Whitepaper (2025, 68pp) and Anthropic Claude Best Practices. Each criterion maps to a verified PE technique.",
    methodA11yTitle: "Accessibility Statement",
    methodA11yBody: "This site complies with Israeli Standard 5568 (WCAG 2.0 Level AA). Accessibility includes: verified color contrast (4.5:1 minimum for body text), full keyboard navigation, ARIA labeling, screen reader support, and adjustable text size. To report accessibility issues:",
    methodContact: "Contact us",
    methodLegalTitle: "Legal Disclaimer",
    methodLegalBody: "This tool offers prompt-phrasing suggestions only and does not guarantee specific results. ChatGPT, Claude, and Gemini are trademarks of their respective owners (OpenAI, Anthropic, and Google). ECHO.11 is not affiliated with, sponsored by, or endorsed by these companies.",
    methodClose: "▲ Close",

    // Templates
    templates: [
      { icon: "✍️", label: "Writing", text: "Write a professional article about the impact of AI on the job market in 2026, for a non-technical executive audience. Use concrete examples from real companies. Structure: 3 paragraphs with headings, 2-sentence summary. Avoid generalizations and buzzwords." },
      { icon: "💻", label: "Code", text: "You are a senior Python developer. Write a function that accepts a list of dictionaries and sorts them by date. Include: type hints, docstring, error handling, and 3 usage examples. Avoid external libraries. Format: code with inline comments." },
      { icon: "📣", label: "Marketing", text: "Create 5 LinkedIn post ideas about prompt engineering for a non-technical marketing audience. For each: headline, opening paragraph, and CTA. Professional but accessible tone, direct and energetic. Avoid technical jargon." },
      { icon: "🔍", label: "Analysis", text: "Analyze a comparison of leading AI writing tools in 2026. Format as a table: pros, cons, price, recommended use cases. Add a concrete example for each tool. For organizational decision-makers. Concise, no marketing spin." },
      { icon: "📧", label: "Email", text: "Write a professional, polite email to a client requesting a discount on an AI consulting service. Explain why the price is justified but offer a creative alternative. Don't be apologetic. Tone: warm but confident. Length: up to 150 words. Include subject line." },
      { icon: "💡", label: "Brainstorm", text: "Give 10 creative Instagram content ideas about AI and digital, for an audience aged 25-45. For each: visual concept + caption + hashtags. Format: 'Idea 1: [Name] — Visual: [description] — Text: [caption]'. Avoid clichés." },
    ],

    // Enhancement modes
    modes: [
      { id: "clarity",     label: "Clarity",     desc: "Simple, structured language", icon: "💎" },
      { id: "specificity", label: "Specificity",  desc: "Details & examples",          icon: "🎯" },
      { id: "context",     label: "Context",      desc: "Background & trends",         icon: "🌐" },
      { id: "format",      label: "Structure",    desc: "Clear output format",         icon: "📐" },
    ],

    // Advanced techniques
    techs: [
      { id: "cot",        label: "Chain of Thought", en: "Chain of Thought" },
      { id: "role",       label: "Role Priming",     en: "Role Priming"     },
      { id: "fewshot",    label: "Few-Shot",          en: "Few-Shot"         },
      { id: "constraint", label: "Constraints",       en: "Constraints"      },
    ],

    // Input panel
    inputLabel: "Your Prompt",
    inputPlaceholder: 'E.g. "Write me an article about AI" — or pick a template above',
    wordCount: (n) => `${n} words`,
    clearBtn: "Clear",
    criteriaCount: (p, t) => `${p}/${t} criteria`,
    showTipsBtn: (n) => `${n} improvement tips`,
    hideTipsBtn: "▲ Hide tips",
    modesTitle: "Enhancement Modes",
    techsTitle: "Advanced Techniques",

    // Improvement tips (keyed by check ID)
    tips: {
      len5:     "Add more detail — prompt is too short (5 words minimum)",
      len20:    "Expand — describe exactly what you want (20+ words)",
      action:   "Start with a clear verb: write, create, analyze, explain, summarize",
      example:  'Add an example: "like X" or "for example Y" — Few-Shot Prompting',
      format:   "Specify desired output format: list, table, paragraphs, JSON",
      role:     'Define a role: "You are an expert in..." — Role Prompting',
      neg:      'Add what NOT to do: "avoid...", "do not include..."',
      steps:    'Break into steps: "First X, then Y, finally Z" — Chain of Thought',
      audience: 'Specify the audience: "for managers" or "for beginners"',
      length:   'Specify length: "in one paragraph", "up to 200 words"',
    },

    // Optimize button states
    optimizeBtn:   "Optimize",
    reOptimizeBtn: "Re-Optimize",
    processingBtn: "Processing...",
    proBtn:        "Pro — Upgrade to Level 10",
    tierHint:      (tier) => `· Level ${tier === 1 ? "7" : "8"}`,
    nudge:         "Prompt ready for enhancement — click Optimize",

    // Output panel
    outputTitle:    "Amplified Prompt",
    outputEmpty:    "Your amplified prompt will appear here",
    outputEmptySub: "Write → Select → Click Optimize",
    analyzingSteps: [
      "Scanning prompt structure...",
      "Identifying weak points...",
      "Applying enhancement techniques...",
      "Generating amplified version...",
    ],
    scoreImproved:   (d) => `+${d} points`,
    copyBtn:         "Copy",
    copiedBtn:       "✓ Copied!",
    reOptimizeShort: "Re-Optimize",
    shareBtn:        "Share",
    proShort:        "Pro",
    pasteLabel:      "Copied? Paste directly in:",

    // Cheers shown after optimization
    cheers: [
      "Strong prompt!",
      "Research-grade prompt engineering",
      "AI will deliver excellent results with this",
      "Professional prompt!",
      "Expert level",
      "Real prompt engineer!",
    ],

    // Session & footer
    sessionCount: (n) => `Optimized ${n} ${n === 1 ? "prompt" : "prompts"} this session`,
    footerTagline: "Independent prompt optimization tool",

    // Paywall modal
    paywallTitle:  "Upgrade to",
    paywallAccent: "Pro",
    paywallSub:    "You've used 2 free optimizations.\nWith Pro you get full professional-grade optimization.",
    paywallTiers: [
      { tier: "Free #1", score: 7,  desc: "Role + Format + Constraints",                   done: true  },
      { tier: "Free #2", score: 8,  desc: "Audience + Steps + Depth",                       done: true  },
      { tier: "Pro",     score: 10, desc: "Full professional structure + all 10 criteria",  done: false },
    ],
    paywallCTA:  "Upgrade to Pro — Coming Soon",
    paywallBack: "Back to free version",

    // Generated optimization text (appended to user prompt)
    opt: {
      role:        "You are a senior expert in the relevant field. Answer precisely and professionally.",
      clarity:     "Write in clear, simple language. Avoid unnecessary jargon.",
      context:     "Consider the full background of the topic, including current trends.",
      example:     "Provide concrete examples — specific cases that clearly illustrate the point.",
      format:      "Output structure: short paragraphs with clear headings.",
      formatModes: "Organize the response with clear headings, short paragraphs, and key bullet points.",
      neg:         "Avoid generalizations, outdated information, and irrelevant content.",
      cot:         "Think step by step: first break down the problem, then reason through each part, finally summarize.",
      role2:       "Answer like a top-tier personal advisor — with confidence and practical experience.",
      audience:    "The answer is intended for a professional audience familiar with the basics but seeking depth.",
      steps:       "Structure the answer in stages: first present the main point, then elaborate, finally summarize.",
      specificity: "Add numerical data, specific names, and real-world examples.",
      fewshot:     "Follow a consistent pattern: Input → Analysis → Output. Apply the same pattern to each part.",
      constraint:  "Focus exclusively on the requested topic. Do not deviate to side topics. Stay concise.",
      length:      "Length: concise yet comprehensive, no more than 500 words unless otherwise required.",
      depth:       "Provide a deep and detailed answer covering all aspects of the question.",
      action:      "Complete the task directly and fully — do not settle for a general explanation.",
      proHeader:   "--- Professional Instructions ---",
      proFooter:   "--- End Instructions ---",
    },
  },

  // ─── HEBREW ───────────────────────────────────────────────────────────────
  he: {
    dir: "rtl",
    htmlLang: "he",

    scoreLabels: ["", "חלש", "בסיסי", "סביר", "לא רע", "בינוני", "טוב", "טוב מאוד", "מצוין", "מקצועי", "מושלם"],
    tierLabels: ["", "בסיסי", "מתקדם", "מקצועי"],

    splashSkip: "דלג לכניסה",
    splashHeadline: ["כל פרומפט יכול", "להיות טוב יותר"],
    splashSub: "גלה כמה.",
    splashCTA: "להתחיל →",

    appSub: "prompt engine",
    skipMain: "דלג לכלי הראשי",
    freeCount: (n) => `${n} חינמי`,
    proLabel: "Pro",
    streakLabel: (n) => `${n} רצף`,
    historyBtn: (n) => `היסטוריה ${n}`,
    shrinkText: "הקטן טקסט",
    growText: "הגדל טקסט",
    toggleLangBtn: "EN",

    heroH1: ["הפרומפט שלך,", "מועצם"],
    heroSub: "כלי חינמי שעוזר לשפר כל פרומפט — לשימוש בכל כלי AI",

    methodBtn: "ⓘ מתודולוגיה ונגישות",
    methodTitle: "מתודולוגיית הציון — 10 קריטריונים",
    methodBody: "מבוסס על Google Prompt Engineering Whitepaper (2025, 68 עמודים) ו-Anthropic Claude Best Practices. כל קריטריון ממופה לטכניקת PE מוכחת.",
    methodA11yTitle: "הצהרת נגישות",
    methodA11yBody: "אתר זה עומד בדרישות תקן ישראלי 5568 (WCAG 2.0 רמה AA). ההנגשה כוללת: ניגודיות צבע מאומתת (4.5:1 מינימום), ניווט מלא במקלדת, תיוג ARIA, תמיכה בקורא מסך, וגודל טקסט מתכוונן. לדיווח על בעיות:",
    methodContact: "צרו קשר",
    methodLegalTitle: "הבהרה משפטית",
    methodLegalBody: "כלי זה מציע הצעות לשיפור ניסוח פרומפטים בלבד, ואינו מבטיח תוצאות ספציפיות. ChatGPT, Claude ו-Gemini הם סימנים מסחריים של בעליהם. ECHO.11 אינו מזוהה, ממומן או מאושר על ידי חברות אלה.",
    methodClose: "▲ סגור",

    templates: [
      { icon: "✍️", label: "כתיבה", text: "כתוב מאמר מקצועי על השפעת AI על שוק העבודה ב-2026, עבור קהל של מנהלים שלא טכניים. השתמש בדוגמאות קונקרטיות מחברות אמיתיות. מבנה: 3 פסקאות עם כותרות, סיכום ב-2 שורות. הימנע מהכללות ומ-buzzwords." },
      { icon: "💻", label: "קוד", text: "אתה מפתח Python בכיר. כתוב פונקציה שמקבלת רשימת מילונים וממיינת לפי תאריך. כולל: type hints, docstring, error handling, ו-3 דוגמאות שימוש. הימנע מספריות חיצוניות. פורמט: קוד עם הערות בעברית." },
      { icon: "📣", label: "שיווק", text: "צור 5 רעיונות לפוסטים בלינקדאין על prompt engineering, עבור קהל של אנשי שיווק לא טכניים. לכל רעיון: כותרת, פסקה ראשונה, ו-CTA. סגנון מקצועי אבל נגיש, בטון ישיר ואנרגטי. הימנע מז'רגון טכני." },
      { icon: "🔍", label: "ניתוח", text: "נתח השוואה בין כלי AI מובילים לכתיבה ב-2026. בפורמט טבלה: יתרונות, חסרונות, מחיר, מקרי שימוש מומלצים. הוסף דוגמה קונקרטית לכל כלי. עבור מקבלי החלטות בארגון. תמציתי, ללא שיווקיות." },
      { icon: "📧", label: "מייל", text: "כתוב מייל מקצועי ואדיב ללקוח שמבקש הנחה על שירות ייעוץ AI. הסבר למה המחיר מוצדק אבל הצע חלופה יצירתית. אל תהיה מתנצל. טון: חם אבל בטוח. אורך: עד 150 מילים. כולל subject line." },
      { icon: "💡", label: "סיעור מוחות", text: "תן 10 רעיונות יצירתיים לתוכן אינסטגרם על AI ודיגיטל, עבור קהל ישראלי 25-45. לכל רעיון: קונספט ויזואלי + כיתוב מוצע + האשטגים. דוגמה לפורמט: 'רעיון 1: [שם] — ויזואל: [תיאור] — טקסט: [כיתוב]'. הימנע מקלישאות." },
    ],

    modes: [
      { id: "clarity",     label: "בהירות", desc: "שפה פשוטה ומובנית", icon: "💎" },
      { id: "specificity", label: "דיוק",   desc: "פרטים ודוגמאות",   icon: "🎯" },
      { id: "context",     label: "הקשר",   desc: "רקע ומגמות",       icon: "🌐" },
      { id: "format",      label: "מבנה",   desc: "פורמט ברור",       icon: "📐" },
    ],

    techs: [
      { id: "cot",        label: "חשיבה שלבית", en: "Chain of Thought" },
      { id: "role",       label: "תפקיד מומחה", en: "Role Priming"     },
      { id: "fewshot",    label: "דוגמאות",      en: "Few-Shot"         },
      { id: "constraint", label: "גבולות",        en: "Constraints"      },
    ],

    inputLabel: "הפרומפט שלך",
    inputPlaceholder: 'לדוגמה: "כתוב לי מאמר על AI" — או בחר תבנית למעלה',
    wordCount: (n) => `${n} מילים`,
    clearBtn: "נקה",
    criteriaCount: (p, t) => `${p}/${t} קריטריונים`,
    showTipsBtn: (n) => `${n} טיפים לשיפור הציון`,
    hideTipsBtn: "▲ הסתר טיפים",
    modesTitle: "מצבי שיפור",
    techsTitle: "טכניקות מתקדמות",

    tips: {
      len5:     "הוסיפ/י עוד פרטים — פרומפט קצר מדי (5 מילים מינימום)",
      len20:    "הרחיב/י — תאר/י מה בדיוק רוצה (20+ מילים)",
      action:   "התחל/י עם פועל ברור: כתוב, צור, נתח, הסבר, סכם",
      example:  "הוסיפ/י דוגמה: \"כמו X\" או \"למשל Y\" — Few-Shot Prompting",
      format:   "ציינ/י פורמט רצוי: רשימה, טבלה, פסקאות, JSON",
      role:     "הגדר/י תפקיד: \"אתה מומחה ב...\" — Role Prompting",
      neg:      "הוסיפ/י מה לא: \"הימנע מ...\", \"אל תכלול...\"",
      steps:    "פרק/י לשלבים: \"ראשית X, אח\"כ Y, לבסוף Z\" — Chain of Thought",
      audience: "ציינ/י למי: \"עבור מנהלים\" או \"למתחילים\"",
      length:   "ציינ/י אורך: \"בפסקה אחת\", \"עד 200 מילים\"",
    },

    optimizeBtn:   "אופטימיזציה",
    reOptimizeBtn: "שפר שוב",
    processingBtn: "מעבד...",
    proBtn:        "Pro — שדרג לרמה 10",
    tierHint:      (tier) => `· רמה ${tier === 1 ? "7" : "8"}`,
    nudge:         "הפרומפט מחכה לשיפור — לחצ/י אופטימיזציה",

    outputTitle:    "פרומפט מועצם",
    outputEmpty:    "הפרומפט המועצם יופיע כאן",
    outputEmptySub: "כתוב → בחר → לחץ אופטימיזציה",
    analyzingSteps: [
      "סורק מבנה פרומפט...",
      "מזהה נקודות חולשה...",
      "מחיל טכניקות שיפור...",
      "מייצר גרסה מועצמת...",
    ],
    scoreImproved:   (d) => `+${d} נקודות`,
    copyBtn:         "העתק",
    copiedBtn:       "✓ הועתק!",
    reOptimizeShort: "שפר שוב",
    shareBtn:        "שתף",
    proShort:        "Pro",
    pasteLabel:      "העתקת? הדבק ישירות ב:",

    cheers: [
      "פרומפט חזק!",
      "הנדסת פרומפט ברמה גבוהה",
      "AI ייתן תוצאה מצוינת עם זה",
      "פרומפט מקצועי!",
      "ברמת מומחה",
      "prompt engineer אמיתי/ת!",
    ],

    sessionCount: (n) => `שיפרת ${n} ${n === 1 ? "פרומפט" : "פרומפטים"} בסשן הזה`,
    footerTagline: "כלי עצמאי לשיפור פרומפטים",

    paywallTitle:  "שדרג ל-",
    paywallAccent: "Pro",
    paywallSub:    "השתמשת ב-2 שיפורים חינמיים.\nעם Pro תקבל/י אופטימיזציה מלאה לרמה 10.",
    paywallTiers: [
      { tier: "חינמי #1", score: 7,  desc: "תפקיד + פורמט + מגבלות",               done: true  },
      { tier: "חינמי #2", score: 8,  desc: "קהל יעד + שלבים + עומק",               done: true  },
      { tier: "Pro",      score: 10, desc: "מבנה מקצועי מלא + כל 10 קריטריונים",   done: false },
    ],
    paywallCTA:  "שדרג ל-Pro — בקרוב",
    paywallBack: "חזרה לגרסה החינמית",

    opt: {
      role:        "אתה מומחה בכיר בתחום הרלוונטי. ענה בדיוק ובמקצועיות.",
      clarity:     "כתוב בשפה ברורה ופשוטה. הימנע ממונחים מיותרים.",
      context:     "התחשב ברקע המלא של הנושא, כולל מגמות עדכניות.",
      example:     "תן דוגמאות קונקרטיות, למשל מקרים ספציפיים שממחישים את הנקודה.",
      format:      "מבנה הפלט: פסקאות קצרות עם כותרות ברורות.",
      formatModes: "ארגן את התשובה עם כותרות ברורות, פסקאות קצרות, ונקודות מפתח.",
      neg:         "הימנע מהכללות, מידע מיושן, ותוכן לא רלוונטי.",
      cot:         "חשוב שלב אחר שלב: קודם פרק את הבעיה, אח\"כ נמק כל חלק, לבסוף סכם.",
      role2:       "ענה כמו יועץ אישי ברמה הגבוהה ביותר — בביטחון, עם ניסיון מעשי.",
      audience:    "התשובה מיועדת עבור קהל מקצועי שמכיר את הבסיס אבל מחפש עומק.",
      steps:       "בנה את התשובה בשלבים: ראשית הצג את הנקודה המרכזית, אח\"כ פרט, לבסוף סכם.",
      specificity: "הוסף נתונים מספריים, שמות ספציפיים, ודוגמאות מהעולם האמיתי.",
      fewshot:     "עקוב אחרי דפוס עקבי: קלט → ניתוח → פלט. החל את אותו דפוס על כל חלק.",
      constraint:  "התמקד אך ורק בנושא המבוקש. אל תסטה לנושאים צדדיים. שמור על תמציתיות.",
      length:      "אורך: תשובה תמציתית ומקיפה, לא יותר מ-500 מילים אלא אם נדרש אחרת.",
      depth:       "ספק תשובה מעמיקה ומפורטת שמכסה את כל ההיבטים של השאלה.",
      action:      "בצע את המשימה בצורה ישירה ומלאה — אל תסתפק בהסבר כללי.",
      proHeader:   "--- הנחיות מקצועיות ---",
      proFooter:   "--- סוף הנחיות ---",
    },
  },
};


// ═══════════════════════════════════════
// LANGUAGE DETECTION & CONTEXT
// ═══════════════════════════════════════

const LANG_STORAGE_KEY = "echo11_lang";

function detectInitialLang() {
  // Priority 1: user's saved preference
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  if (stored === "he" || stored === "en") return stored;
  // Priority 2: browser language
  const browser = (navigator.language || navigator.userLanguage || "").toLowerCase();
  return browser.startsWith("he") ? "he" : "en";  // Priority 3: default EN
}

const LangCtx = createContext({
  lang: "en",
  T: TRANSLATIONS.en,
  toggleLang: () => {},
});
const useLang = () => useContext(LangCtx);


// ═══════════════════════════════════════
// SCORING ENGINE
// ═══════════════════════════════════════

function analyzePrompt(text) {
  if (!text.trim()) return { score: 0, checks: [], tipIds: [], passedW: 0, maxW: 0 };

  // Regex patterns check both Hebrew and English — bilingual prompts score correctly
  const checks = [
    { id: "len5",     test: () => text.trim().split(/\s+/).length >= 5,   w: 1   },
    { id: "len20",    test: () => text.trim().split(/\s+/).length >= 20,  w: 1   },
    { id: "action",   test: () => /\?|כתוב|צור|תן|הסבר|נתח|השוו|ספק|ארגן|סכם|תרגם|בנה|עצב|הצע|write|create|explain|analyze|give|provide|list|summarize|translate|build|design|suggest|compare|generate|draft/i.test(text), w: 1 },
    { id: "example",  test: () => /למשל|דוגמה|כגון|כמו|בסגנון|בדומה|example|like|such as|e\.g\.|similar to|in the style of/i.test(text), w: 1.5 },
    { id: "format",   test: () => /בפורמט|מבנה|רשימה|טבלה|כותרות|פסקאות|נקודות|JSON|markdown|bullet|table|list|heading|פסקה|שורות|סעיפים/i.test(text), w: 1 },
    { id: "role",     test: () => /אתה|הנך|מומחה|יועץ|מנהל|כ(מומחה|יועץ|עורך|מנהל|מתכנת)|act as|you are|as a|expert|professional|specialist/i.test(text), w: 1 },
    { id: "neg",      test: () => /אל |ללא |הימנע|בלי|don't|avoid|do not|without|never|אסור|לא לכלול|אין להשתמש/i.test(text), w: 1 },
    { id: "steps",    test: () => /שלב|צעד|קודם|אח.כ|לבסוף|step|first|then|finally|1\.|2\.|ראשית|שנית|לסיכום/i.test(text), w: 1 },
    { id: "audience", test: () => /עבור|ל(מתחילים|מנהלים|סטודנטים|מפתחים|קהל|ילדים|מבוגרים)|for|audience|beginner|advanced|targeted|מיועד/i.test(text), w: 1 },
    { id: "length",   test: () => /קצר|ארוך|מילים|פסקאות|שורות|תמציתי|brief|concise|detailed|words|paragraph|עד \d+|לא יותר מ/i.test(text), w: 0.5 },
  ];

  const evaluated = checks.map(c => ({ ...c, pass: c.test() }));
  const maxW    = evaluated.reduce((s, c) => s + c.w, 0);
  const passedW = evaluated.filter(c => c.pass).reduce((s, c) => s + c.w, 0);
  let score = Math.round((passedW / maxW) * 10);
  if (text.trim().length > 0 && score < 1) score = 1;

  return {
    score:   Math.min(10, score),
    checks:  evaluated,
    tipIds:  evaluated.filter(c => !c.pass).slice(0, 3).map(c => c.id),
    passedW,
    maxW,
  };
}


// ═══════════════════════════════════════
// OPTIMIZATION ENGINE — 3 Tiers
// Uses T.opt strings for generated text (EN or HE)
// ═══════════════════════════════════════

function buildOptimized(original, modes, techs, tier = 1, lang = "en") {
  if (!original.trim()) return "";
  const text = original.trim();
  const analysis = analyzePrompt(text);
  const O = TRANSLATIONS[lang].opt;
  const parts = [];

  if (!analysis.checks.find(c => c.id === "role")?.pass)   parts.push(O.role);
  if (modes.includes("clarity"))                             parts.push(O.clarity);
  if (modes.includes("context"))                             parts.push(O.context);

  parts.push(""); parts.push(text); parts.push("");

  if (!analysis.checks.find(c => c.id === "example")?.pass) parts.push(O.example);
  if (!analysis.checks.find(c => c.id === "format")?.pass)  parts.push(modes.includes("format") ? O.formatModes : O.format);
  if (!analysis.checks.find(c => c.id === "neg")?.pass)     parts.push(O.neg);
  if (techs.includes("cot"))                                 parts.push(O.cot);
  if (techs.includes("role") && analysis.checks.find(c => c.id === "role")?.pass) parts.push(O.role2);

  if (tier === 1) return parts.filter(Boolean).join("\n");

  if (!analysis.checks.find(c => c.id === "audience")?.pass) parts.push(O.audience);
  if (!analysis.checks.find(c => c.id === "steps")?.pass)    parts.push(O.steps);
  if (modes.includes("specificity"))                          parts.push(O.specificity);
  if (techs.includes("fewshot"))                              parts.push(O.fewshot);
  if (techs.includes("constraint"))                           parts.push(O.constraint);

  if (tier === 2) return parts.filter(Boolean).join("\n");

  if (!analysis.checks.find(c => c.id === "length")?.pass) parts.push(O.length);
  if (!analysis.checks.find(c => c.id === "len20")?.pass)  parts.push(O.depth);
  if (!analysis.checks.find(c => c.id === "action")?.pass) parts.push(O.action);
  parts.unshift(O.proHeader);
  parts.push(O.proFooter);
  return parts.filter(Boolean).join("\n");
}


// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════

/*
  WCAG 2.0 AA compliant score colors — all verified ≥4.5:1 on #FAFAF8 and #fff
*/
const COLORS = ["#71717a","#b91c1c","#c2410c","#a16207","#92400e","#4d7c0f","#15803d","#047857","#0e7490","#4338ca","#6d28d9"];

const AI_LINKS = [
  { name: "ChatGPT", url: "https://chat.openai.com", color: "#0d7a5f" },
  { name: "Claude",  url: "https://claude.ai",       color: "#a16207" },
  { name: "Gemini",  url: "https://gemini.google.com", color: "#1a56db" },
];

const FREE_LIMIT = 2;


// ═══════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════

function Ring({ score, size = 44, stroke = 3.5 }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const offset = circ - (score / 10) * circ;
  const c = COLORS[score] || "#71717a";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
      role="img" aria-label={`Score ${score} out of 10`}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "all 0.8s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: size * 0.3, color: c, fontFamily: "'Space Mono', monospace", transition: "color 0.5s" }}>
        {score}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, label }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <div style={{ height: 4, background: "#d4d4d8", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`,
          background: pct >= 70 ? "#15803d" : pct >= 40 ? "#92400e" : "#b91c1c",
          borderRadius: 2, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

function useTypewriter(text, speed = 5) {
  const [d, setD] = useState(""); const [done, setDone] = useState(false);
  useEffect(() => {
    if (!text) { setD(""); setDone(false); return; }
    setDone(false); let i = 0; setD("");
    const id = setInterval(() => {
      i += 5;
      if (i >= text.length) { setD(text); setDone(true); clearInterval(id); }
      else setD(text.slice(0, i));
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return { d, done };
}


// ═══════════════════════════════════════
// LANGUAGE TOGGLE BUTTON
// ═══════════════════════════════════════

function LangToggle() {
  const { T, toggleLang } = useLang();
  return (
    <button
      onClick={toggleLang}
      aria-label={`Switch language to ${T.toggleLangBtn}`}
      title={`Switch to ${T.toggleLangBtn}`}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
        padding: "4px 10px", height: 28, minWidth: 44, borderRadius: 6,
        background: "transparent", border: "1px solid currentColor",
        opacity: 0.55, cursor: "pointer",
        fontSize: "0.68em", fontWeight: 700, letterSpacing: "0.08em",
        fontFamily: "inherit", color: "inherit",
        transition: "opacity 0.18s ease", userSelect: "none",
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "0.55")}
    >
      {/* Globe icon */}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      {T.toggleLangBtn}
    </button>
  );
}


// ═══════════════════════════════════════
// SPLASH
// ═══════════════════════════════════════

function Splash({ onEnter }) {
  const { T } = useLang();
  const [phase, setPhase] = useState(0);
  const [ringScore, setRingScore] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 150),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1100),
      setTimeout(() => setPhase(4), 1700),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase < 3) return;
    setRingScore(3);
    const t = setTimeout(() => setRingScore(10), 600);
    return () => clearTimeout(t);
  }, [phase]);

  const show = (n) => ({
    opacity: phase >= n ? 1 : 0,
    transform: phase >= n ? "none" : "translateY(10px)",
    transition: "all 0.55s cubic-bezier(.4,0,.2,1)",
  });

  return (
    <div dir={T.dir} lang={T.htmlLang} role="main" aria-label="ECHO.11 — Prompt Optimization Tool"
      style={{ minHeight: "100vh", background: "#FAFAF8", fontFamily: "'Rubik', sans-serif",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "40px 24px", position: "relative", overflow: "hidden" }}>

      <a href="#splash-cta"
        style={{ position: "absolute", top: -60, right: 0, background: "#1a1a1a", color: "#fff",
          padding: "8px 16px", borderRadius: "0 0 0 8px", zIndex: 100, fontSize: "0.85em", textDecoration: "none" }}
        onFocus={e => (e.target.style.top = "0")} onBlur={e => (e.target.style.top = "-60px")}>
        {T.splashSkip}
      </a>

      {/* Language toggle on splash */}
      <div style={{ position: "absolute", top: 16, right: 20, ...show(4) }}>
        <LangToggle />
      </div>

      <div aria-hidden="true" style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent 5%, rgba(194,65,12,0.05) 50%, transparent 95%)",
        pointerEvents: "none" }} />

      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div style={{ ...show(1), marginBottom: 56 }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.7em", fontWeight: 700, color: "#8a8a8a", letterSpacing: 4 }}>
            ECHO.11
          </span>
        </div>
        <div style={{ ...show(2), marginBottom: 14 }}>
          <h1 style={{ fontSize: "clamp(1.5em, 4.5vw, 2.1em)", fontWeight: 800, letterSpacing: "-0.5px",
            color: "#1a1a1a", margin: 0, lineHeight: 1.25 }}>
            {T.splashHeadline[0]}<br />
            <span style={{ color: "#c2410c" }}>{T.splashHeadline[1]}</span>
          </h1>
        </div>
        <div style={{ ...show(2), marginBottom: 44 }}>
          <p style={{ color: "#636363", fontSize: "0.92em", margin: 0, fontWeight: 400 }}>{T.splashSub}</p>
        </div>
        <div style={{ ...show(3), marginBottom: 44, display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative" }}>
            <Ring score={ringScore} size={80} stroke={3.5} />
            <div aria-hidden="true" style={{ position: "absolute", inset: -24, borderRadius: "50%",
              background: `radial-gradient(circle, ${COLORS[ringScore]}12 0%, transparent 70%)`,
              transition: "all 1s ease", pointerEvents: "none" }} />
          </div>
        </div>
        <div style={show(4)}>
          <button id="splash-cta" onClick={onEnter}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            aria-label="Enter the prompt optimization tool"
            style={{ background: "#1a1a1a", color: "#FAFAF8", border: "none", borderRadius: 50,
              padding: hovered ? "13px 42px" : "13px 34px",
              fontSize: "0.86em", fontWeight: 600, fontFamily: "'Rubik', sans-serif",
              cursor: "pointer", letterSpacing: "0.2px",
              transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
              boxShadow: hovered ? "0 6px 24px rgba(0,0,0,0.10)" : "0 2px 8px rgba(0,0,0,0.04)" }}>
            {T.splashCTA}
          </button>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 20, fontSize: "0.6em", ...show(4) }}>
        <a href="https://shirasarid.substack.com" target="_blank" rel="noopener noreferrer"
          style={{ color: "#636363", textDecoration: "none" }}>Shira Sarid</a>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════
// PAYWALL MODAL — with focus trap
// ═══════════════════════════════════════

function ProModal({ onClose }) {
  const { T } = useLang();
  const modalRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)",
      zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose} role="dialog" aria-modal="true" aria-label="Upgrade to Pro">
      <div ref={modalRef} onClick={e => e.stopPropagation()} dir={T.dir}
        style={{ background: "#fff", borderRadius: 20, padding: "32px 28px", maxWidth: 380, width: "100%",
          textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", animation: "fadeIn 0.3s ease" }}>

        <div style={{ width: 48, height: 48, borderRadius: 10, background: "#1a1a1a",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#FAFAF8", fontWeight: 800, fontSize: 14, fontFamily: "'Space Mono', monospace",
          margin: "0 auto 16px" }} aria-hidden="true">E.11</div>

        <h2 style={{ fontSize: "1.3em", fontWeight: 800, margin: "0 0 6px", color: "#1a1a1a" }}>
          {T.paywallTitle}<span style={{ color: "#c2410c" }}>{T.paywallAccent}</span>
        </h2>

        <p style={{ color: "#555", fontSize: "0.85em", margin: "0 0 20px", lineHeight: 1.6, whiteSpace: "pre-line" }}>
          {T.paywallSub}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20, textAlign: T.dir === "rtl" ? "right" : "left" }}>
          {T.paywallTiers.map((tier, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
              background: tier.done ? "#f5f5f3" : "#fef3ec", borderRadius: 8,
              border: tier.done ? "1px solid #d4d4d8" : "1px solid #e5a07a" }}>
              <Ring score={tier.score} size={28} stroke={2.5} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.78em", fontWeight: 700, color: tier.done ? "#636363" : "#c2410c" }}>
                  {tier.tier} {tier.done && "✓"}
                </div>
                <div style={{ fontSize: "0.68em", color: "#636363" }}>{tier.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button style={{ width: "100%", padding: "12px", background: "#c2410c", color: "#fff", border: "none",
          borderRadius: 10, fontWeight: 700, fontSize: "0.9em", fontFamily: "'Rubik', sans-serif",
          cursor: "pointer", marginBottom: 8 }}
          onClick={() => window.open("https://shirasarid.substack.com", "_blank")}>
          {T.paywallCTA}
        </button>

        <button ref={closeRef} onClick={onClose}
          style={{ background: "none", border: "none", color: "#636363", cursor: "pointer",
            fontSize: "0.78em", fontFamily: "'Rubik', sans-serif", fontWeight: 400, padding: "8px" }}>
          {T.paywallBack}
        </button>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════
// METHODOLOGY + ACCESSIBILITY NOTE
// ═══════════════════════════════════════

function MethodologyNote({ show, onToggle }) {
  const { T } = useLang();

  if (!show) return (
    <button onClick={onToggle}
      style={{ background: "none", border: "none", color: "#636363", cursor: "pointer",
        fontSize: "0.65em", fontFamily: "'Space Mono', monospace", padding: "4px 0" }}>
      {T.methodBtn}
    </button>
  );

  return (
    <div style={{ background: "#f5f5f3", border: "1px solid #d4d4d8", borderRadius: 10, padding: 14,
      marginTop: 8, fontSize: "0.72em", color: "#444", lineHeight: 1.7,
      textAlign: T.dir === "rtl" ? "right" : "left" }}>
      <div style={{ fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>{T.methodTitle}</div>
      <div>{T.methodBody}</div>
      <div style={{ marginTop: 6 }}>
        <a href="https://www.kaggle.com/whitepaper-prompt-engineering" target="_blank" rel="noopener noreferrer"
          style={{ color: "#c2410c", textDecoration: "underline" }}>Google Whitepaper</a>
        {" · "}
        <a href="https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview" target="_blank" rel="noopener noreferrer"
          style={{ color: "#c2410c", textDecoration: "underline" }}>Anthropic Docs</a>
      </div>

      <div style={{ borderTop: "1px solid #d4d4d8", marginTop: 10, paddingTop: 10 }}>
        <div style={{ fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>{T.methodA11yTitle}</div>
        <div>{T.methodA11yBody}{" "}
          <a href="https://shirasarid.substack.com" target="_blank" rel="noopener noreferrer"
            style={{ color: "#c2410c", textDecoration: "underline" }}>{T.methodContact}</a>.
        </div>
      </div>

      <div style={{ borderTop: "1px solid #d4d4d8", marginTop: 10, paddingTop: 10 }}>
        <div style={{ fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>{T.methodLegalTitle}</div>
        <div>{T.methodLegalBody}</div>
      </div>

      <button onClick={onToggle}
        style={{ background: "none", border: "none", color: "#636363", cursor: "pointer",
          fontSize: "0.9em", marginTop: 6, fontFamily: "inherit", padding: "4px 0" }}>
        {T.methodClose}
      </button>
    </div>
  );
}


// ═══════════════════════════════════════
// MAIN TOOL
// ═══════════════════════════════════════

function Tool() {
  const { lang, T, toggleLang } = useLang();

  const [input, setInput]           = useState("");
  const [output, setOutput]         = useState("");
  const [modes, setModes]           = useState(["clarity"]);
  const [techs, setTechs]           = useState([]);
  const [phase, setPhase]           = useState("idle");
  const [history, setHistory]       = useState([]);
  const [showHist, setShowHist]     = useState(false);
  const [showTips, setShowTips]     = useState(false);
  const [showMethod, setShowMethod] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [fontSize, setFontSize]     = useState(16);
  const [totalOpts, setTotalOpts]   = useState(0);
  const [iterCount, setIterCount]   = useState(0);
  const [copied, setCopied]         = useState(false);
  const [cheer, setCheer]           = useState("");
  const [streak, setStreak]         = useState(0);
  const [currentTier, setCurrentTier] = useState(0);

  const origA = useMemo(() => analyzePrompt(input),  [input]);
  const optA  = useMemo(() => analyzePrompt(output), [output]);
  const { d: typed, done } = useTypewriter(phase === "done" ? output : "");

  const toggle = (arr, setFn, id) =>
    setFn(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const getNextTier = () => {
    if (totalOpts === 0) return 1;
    if (totalOpts === 1) return 2;
    return 3;
  };

  const handleOptimize = () => {
    if (!input.trim()) return;
    const tier = getNextTier();
    if (tier >= 3) { setShowPaywall(true); return; }

    setPhase("analyzing"); setOutput(""); setCheer(""); setCurrentTier(tier);
    setTimeout(() => {
      const r = buildOptimized(input, modes, techs, tier, lang);  // ← passes current lang
      setOutput(r); setPhase("done"); setIterCount(c => c + 1); setStreak(s => s + 1);
      setTotalOpts(c => c + 1);
      setCheer(T.cheers[Math.floor(Math.random() * T.cheers.length)]);
      const oS = analyzePrompt(input).score, nS = analyzePrompt(r).score;
      setHistory(prev => [{
        t: input.trim().slice(0, 55), orig: input, opt: r, oS, nS, tier,
        modes: [...modes], techs: [...techs],
        time: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
      }, ...prev.slice(0, 29)]);
    }, 1400);
  };

  const handleReOptimize = () => { setInput(output); setOutput(""); setPhase("idle"); };
  const handleClear = () => { setInput(""); setOutput(""); setPhase("idle"); setIterCount(0); setShowTips(false); };
  const handleCopy = async () => {
    if (!output) return;
    try { await navigator.clipboard.writeText(output); }
    catch { const t = document.createElement("textarea"); t.value = output; document.body.appendChild(t); t.select(); document.execCommand("copy"); document.body.removeChild(t); }
    setCopied(true); setTimeout(() => setCopied(false), 2200);
  };
  const handleShare = () => {
    const msg = `ECHO.11: ${origA.score}/10 → ${optA.score}/10\nhttps://echo-11-prompt.vercel.app`;
    if (navigator.share) navigator.share({ title: "ECHO.11", text: msg }).catch(() => {});
    else window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://echo-11-prompt.vercel.app")}`, "_blank");
  };

  const [step, setStep] = useState(0);
  useEffect(() => {
    if (phase !== "analyzing") { setStep(0); return; }
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i >= T.analyzingSteps.length) clearInterval(id); else setStep(i);
    }, 300);
    return () => clearInterval(id);
  }, [phase, T]);

  const showNudge  = input.trim().length > 10 && phase === "idle" && !output;
  const remainingFree = Math.max(0, FREE_LIMIT - totalOpts);
  const nextTier      = getNextTier();

  const S = {
    card: { background: "#fff", border: "1px solid #d4d4d8", borderRadius: 16, padding: 18,
      boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }
  };

  return (
    <div dir={T.dir} lang={T.htmlLang} style={{ minHeight: "100vh", fontSize, fontFamily: "'Rubik', sans-serif",
      background: "#FAFAF8", color: "#1a1a1a", lineHeight: 1.6, animation: "fadeIn 0.4s ease" }}>

      {showPaywall && <ProModal onClose={() => setShowPaywall(false)} />}

      <a href="#main"
        style={{ position: "absolute", top: -60, right: 0, background: "#1a1a1a", color: "#fff",
          padding: "8px 16px", borderRadius: "0 0 0 8px", zIndex: 100, fontSize: "0.85em", textDecoration: "none" }}
        onFocus={e => (e.target.style.top = "0")} onBlur={e => (e.target.style.top = "-60px")}>
        {T.skipMain}
      </a>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header role="banner" style={{ padding: "10px 20px", display: "flex", justifyContent: "space-between",
        alignItems: "center", borderBottom: "1px solid #d4d4d8",
        background: "rgba(250,250,248,0.92)", backdropFilter: "blur(16px)",
        position: "sticky", top: 0, zIndex: 50, flexWrap: "wrap", gap: 8 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 7, background: "#1a1a1a",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#FAFAF8", fontWeight: 800, fontSize: 10, fontFamily: "'Space Mono', monospace" }}
            role="img" aria-label="ECHO.11 logo">E.11</div>
          <div>
            <span style={{ fontWeight: 700, fontSize: "0.9em" }}>ECHO.11</span>
            <span style={{ fontSize: "0.65em", color: "#636363", marginRight: 6, marginLeft: 6 }}>{T.appSub}</span>
          </div>
        </div>

        <nav aria-label="Main actions" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Language toggle — small, discrete */}
          <LangToggle />

          <span style={{ fontSize: "0.68em", fontWeight: 600, fontFamily: "'Space Mono', monospace",
            color: remainingFree > 0 ? "#15803d" : "#b91c1c" }}>
            {remainingFree > 0 ? T.freeCount(remainingFree) : T.proLabel}
          </span>

          {streak > 0 && (
            <span style={{ fontSize: "0.75em", color: "#92400e", fontWeight: 700 }} role="status">
              {T.streakLabel(streak)}
            </span>
          )}

          {history.length > 0 && (
            <button onClick={() => setShowHist(!showHist)}
              aria-expanded={showHist} aria-label={`${T.historyBtn(history.length)} — ${history.length} items`}
              style={{ background: showHist ? "#1a1a1a" : "transparent",
                color: showHist ? "#fff" : "#636363",
                border: "1px solid #d4d4d8", borderRadius: 7, padding: "4px 10px",
                cursor: "pointer", fontSize: "0.75em", fontWeight: 600, fontFamily: "inherit",
                transition: "all 0.2s" }}>
              {T.historyBtn(history.length)}
            </button>
          )}

          <div style={{ display: "flex", gap: 2 }} role="group" aria-label="Text size">
            <button onClick={() => setFontSize(s => Math.max(13, s - 1))} aria-label={T.shrinkText}
              style={{ width: 26, height: 26, borderRadius: 5, border: "1px solid #d4d4d8",
                background: "transparent", cursor: "pointer", fontSize: "0.68em", fontFamily: "inherit", color: "#636363" }}>
              A-
            </button>
            <button onClick={() => setFontSize(s => Math.min(22, s + 1))} aria-label={T.growText}
              style={{ width: 26, height: 26, borderRadius: 5, border: "1px solid #d4d4d8",
                background: "transparent", cursor: "pointer", fontSize: "0.68em", fontFamily: "inherit", color: "#636363" }}>
              A+
            </button>
          </div>
        </nav>
      </header>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section style={{ textAlign: "center", padding: "28px 20px 12px", maxWidth: 560, margin: "0 auto" }}
        aria-label="Main heading">
        <h1 style={{ fontSize: "clamp(1.2em, 3.5vw, 1.8em)", fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.5px" }}>
          {T.heroH1[0]} <span style={{ color: "#c2410c" }}>{T.heroH1[1]}</span>
        </h1>
        <p style={{ color: "#555", fontSize: "0.82em", margin: "0 0 2px" }}>{T.heroSub}</p>
        <MethodologyNote show={showMethod} onToggle={() => setShowMethod(!showMethod)} />
      </section>

      {/* ── TEMPLATES ──────────────────────────────────────────── */}
      <section style={{ maxWidth: 920, margin: "0 auto 10px", padding: "0 16px" }} aria-label="Prompt templates">
        <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }} role="list">
          {T.templates.map((tpl, i) => (
            <button key={i} role="listitem"
              onClick={() => { setInput(tpl.text); setOutput(""); setPhase("idle"); setShowTips(false); }}
              aria-label={`Template: ${tpl.label}`}
              style={{ background: "#fff", border: "1px solid #d4d4d8", borderRadius: 9, padding: "6px 12px",
                cursor: "pointer", whiteSpace: "nowrap", fontSize: "0.75em", fontFamily: "inherit",
                color: "#555", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 4 }}>
              <span aria-hidden="true">{tpl.icon}</span>{tpl.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── MAIN ───────────────────────────────────────────────── */}
      <main id="main" role="main" style={{ maxWidth: 920, margin: "0 auto", padding: "0 16px 40px" }}>

        {/* History panel */}
        {showHist && history.length > 0 && (
          <div style={{ ...S.card, marginBottom: 12, maxHeight: 180, overflowY: "auto", padding: 12 }}
            role="region" aria-label="Prompt history">
            {history.map((h, i) => (
              <button key={i}
                onClick={() => { setInput(h.orig); setOutput(h.opt); setModes(h.modes); setTechs(h.techs); setPhase("done"); setShowHist(false); setCurrentTier(h.tier); }}
                aria-label={`${h.t} — score ${h.oS} to ${h.nS}`}
                style={{ width: "100%", textAlign: T.dir === "rtl" ? "right" : "left",
                  padding: "6px 8px", border: "none",
                  borderBottom: i < history.length - 1 ? "1px solid #e5e5e3" : "none",
                  background: "transparent", cursor: "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontFamily: "inherit", fontSize: "0.8em", color: "#444", borderRadius: 4 }}>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {h.t}...
                </span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.85em", flexShrink: 0 }}>
                  <span style={{ color: COLORS[h.oS] }}>{h.oS}</span>
                  <span style={{ color: "#636363" }}> → </span>
                  <span style={{ color: COLORS[h.nS] }}>{h.nS}</span>
                  <span style={{ color: "#636363", fontSize: "0.75em", marginLeft: 4, marginRight: 4 }}>T{h.tier}</span>
                  <span style={{ color: "#636363", fontSize: "0.8em", marginLeft: 6, marginRight: 6 }}>{h.time}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Two-column grid */}
        <div className="echo-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

          {/* ═══ INPUT PANEL ═══ */}
          <div style={{ ...S.card, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label htmlFor="prompt-input" style={{ fontWeight: 700, fontSize: "0.88em" }}>
                {T.inputLabel}
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Ring score={origA.score} size={36} stroke={3} />
                {origA.score > 0 && (
                  <span style={{ fontSize: "0.7em", color: COLORS[origA.score], fontWeight: 600 }}>
                    {T.scoreLabels[origA.score]}
                  </span>
                )}
              </div>
            </div>

            <textarea id="prompt-input" value={input}
              onChange={e => { setInput(e.target.value); if (phase === "done") setPhase("idle"); }}
              placeholder={T.inputPlaceholder}
              aria-label={T.inputLabel} aria-describedby="input-help"
              style={{ flex: 1, minHeight: 130, background: "#FAFAF8", border: "1px solid #d4d4d8",
                borderRadius: 11, padding: 12, color: "#1a1a1a", fontSize: "0.9em",
                fontFamily: "inherit", resize: "vertical", outline: "none", lineHeight: 1.7,
                transition: "border-color 0.2s, box-shadow 0.2s",
                direction: "auto",  /* let browser detect prompt direction */
              }}
              onFocus={e => { e.target.style.borderColor = "#c2410c"; e.target.style.boxShadow = "0 0 0 3px #c2410c1a"; }}
              onBlur={e => { e.target.style.borderColor = "#d4d4d8"; e.target.style.boxShadow = "none"; }} />

            <div id="input-help" style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: "0.68em", color: "#636363" }}>
              <span>{input.trim() ? T.wordCount(input.trim().split(/\s+/).length) : T.wordCount(0)}</span>
              {input && (
                <button onClick={handleClear} aria-label={T.clearBtn}
                  style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer",
                    fontSize: "1em", fontFamily: "inherit", fontWeight: 600, padding: 0 }}>
                  {T.clearBtn}
                </button>
              )}
            </div>

            {input.trim() && (
              <div style={{ marginTop: 6 }}>
                <ProgressBar value={origA.checks.filter(c => c.pass).length} max={origA.checks.length}
                  label="Prompt quality progress" />
                <div style={{ fontSize: "0.68em", color: "#636363", marginTop: 2 }}>
                  {T.criteriaCount(origA.checks.filter(c => c.pass).length, origA.checks.length)}
                </div>
              </div>
            )}

            {input.trim() && origA.tipIds.length > 0 && (
              <button onClick={() => setShowTips(!showTips)} aria-expanded={showTips}
                style={{ background: "none", border: "none", color: "#c2410c", cursor: "pointer",
                  fontSize: "0.73em", fontWeight: 600, fontFamily: "inherit",
                  textAlign: T.dir === "rtl" ? "right" : "left", padding: "4px 0", marginTop: 4 }}>
                {showTips ? T.hideTipsBtn : T.showTipsBtn(origA.tipIds.length)}
              </button>
            )}

            {showTips && origA.tipIds.length > 0 && (
              <div style={{ background: "#fef3ec", border: "1px solid #e5a07a", borderRadius: 8,
                padding: 10, marginTop: 2, fontSize: "0.76em" }} role="alert">
                {origA.tipIds.map((id, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: i < origA.tipIds.length - 1 ? 5 : 0,
                    color: "#92400e", lineHeight: 1.5 }}>
                    <span aria-hidden="true">•</span>
                    <span>{T.tips[id] || id}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Enhancement Modes */}
            <fieldset style={{ border: "none", padding: 0, margin: "10px 0 0" }}>
              <legend style={{ fontSize: "0.72em", color: "#555", marginBottom: 4, fontWeight: 600 }}>
                {T.modesTitle}
              </legend>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {T.modes.map(m => {
                  const on = modes.includes(m.id);
                  return (
                    <button key={m.id} onClick={() => toggle(modes, setModes, m.id)}
                      role="switch" aria-checked={on} aria-label={`${m.label}: ${m.desc}`}
                      style={{ background: on ? "#1a1a1a" : "#FAFAF8", color: on ? "#fff" : "#555",
                        border: `1px solid ${on ? "#1a1a1a" : "#d4d4d8"}`, borderRadius: 8,
                        padding: "6px 8px", cursor: "pointer",
                        textAlign: T.dir === "rtl" ? "right" : "left",
                        transition: "all 0.15s", fontFamily: "inherit", fontSize: "0.78em" }}>
                      <span aria-hidden="true">{m.icon} </span><strong>{m.label}</strong>
                      <div style={{ fontSize: "0.8em", opacity: on ? 0.8 : 0.7 }}>{m.desc}</div>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Advanced Techniques */}
            <fieldset style={{ border: "none", padding: 0, margin: "8px 0 0" }}>
              <legend style={{ fontSize: "0.72em", color: "#555", marginBottom: 4, fontWeight: 600 }}>
                {T.techsTitle}
              </legend>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {T.techs.map(t => {
                  const on = techs.includes(t.id);
                  return (
                    <button key={t.id} onClick={() => toggle(techs, setTechs, t.id)}
                      role="switch" aria-checked={on} aria-label={`${t.label} (${t.en})`}
                      style={{ background: on ? "#c2410c" : "#fff", color: on ? "#fff" : "#636363",
                        border: `1px solid ${on ? "#c2410c" : "#d4d4d8"}`, borderRadius: 16,
                        padding: "4px 12px", cursor: "pointer",
                        fontSize: "0.75em", fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s" }}>
                      {t.label}{on && " ✓"}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Optimize CTA */}
            <button onClick={handleOptimize}
              disabled={!input.trim() || phase === "analyzing"}
              aria-label="Optimize prompt"
              style={{ marginTop: 12, width: "100%", padding: "11px", border: "none", borderRadius: 10,
                fontWeight: 700, fontSize: "0.9em", fontFamily: "inherit",
                cursor: input.trim() && phase !== "analyzing" ? "pointer" : "not-allowed",
                background: nextTier >= 3 ? "linear-gradient(135deg, #c2410c, #a83508)"
                  : input.trim() ? "#1a1a1a" : "#d4d4d8",
                color: input.trim() ? "#fff" : "#555",
                transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {phase === "analyzing" ? (
                <>
                  <span style={{ display: "inline-block", width: 14, height: 14,
                    border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
                    borderRadius: "50%", animation: "spin 0.7s linear infinite" }} aria-hidden="true" />
                  {T.processingBtn}
                </>
              ) : nextTier >= 3 ? T.proBtn : (
                <>
                  {totalOpts > 0 ? T.reOptimizeBtn : T.optimizeBtn}
                  <span style={{ fontSize: "0.7em", opacity: 0.7 }}>{T.tierHint(nextTier)}</span>
                </>
              )}
            </button>

            <div style={{ fontSize: "0.72em", color: "#c2410c", textAlign: "center",
              marginTop: 6, height: 20,
              opacity: showNudge ? 1 : 0, transition: "opacity 0.3s ease" }}
              role="status" aria-hidden={!showNudge}>
              {T.nudge}
            </div>
          </div>

          {/* ═══ OUTPUT PANEL ═══ */}
          <div style={{ ...S.card, display: "flex", flexDirection: "column", minHeight: 380,
            background: phase === "done" ? "#fff" : "#FAFAF8", transition: "background 0.3s" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 6, minHeight: 38 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: "0.88em" }}>{T.outputTitle}</span>
                <span style={{ fontSize: "0.6em", fontWeight: 700,
                  color: currentTier === 1 ? "#15803d" : "#4338ca",
                  background: currentTier === 1 ? "#15803d14" : "#4338ca14",
                  padding: "2px 8px", borderRadius: 10,
                  opacity: phase === "done" && currentTier > 0 ? 1 : 0, transition: "opacity 0.3s" }}>
                  Tier {currentTier || 1} · {T.tierLabels[currentTier || 1]}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6,
                opacity: phase === "done" ? 1 : 0, transition: "opacity 0.3s" }}>
                <Ring score={phase === "done" ? optA.score : 0} size={36} stroke={3} />
                <span style={{ fontSize: "0.7em", color: COLORS[optA.score], fontWeight: 600 }}>
                  {phase === "done" ? T.scoreLabels[optA.score] : ""}
                </span>
              </div>
            </div>

            {/* Analyzing state */}
            {phase === "analyzing" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 8 }} role="status" aria-live="polite">
                <div style={{ width: 40, height: 40, borderRadius: "50%",
                  border: "3px solid #d4d4d8", borderTopColor: "#c2410c",
                  animation: "spin 0.8s linear infinite" }} aria-hidden="true" />
                {T.analyzingSteps.map((s, i) => (
                  <div key={i} style={{ fontSize: "0.78em", display: "flex", alignItems: "center", gap: 6,
                    color: i <= step ? "#1a1a1a" : "#a1a1a1",
                    fontWeight: i === step ? 700 : 400, transition: "all 0.3s" }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: i < step ? "#15803d" : i === step ? "#c2410c" : "#d4d4d8",
                      color: "#fff", fontSize: "0.6em", fontWeight: 800, flexShrink: 0 }}
                      aria-hidden="true">{i < step ? "✓" : i + 1}</span>
                    {s}
                  </div>
                ))}
              </div>
            )}

            {/* Idle state */}
            {phase === "idle" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: "2em", opacity: 0.12, marginBottom: 6 }} aria-hidden="true">✦</div>
                <div style={{ fontSize: "0.82em", color: "#636363" }}>{T.outputEmpty}</div>
                <div style={{ fontSize: "0.72em", color: "#71717a", marginTop: 3 }}>{T.outputEmptySub}</div>
              </div>
            )}

            {/* Done state */}
            {phase === "done" && (
              <>
                <div style={{ flex: 1, minHeight: 120, background: "#FAFAF8", border: "1px solid #d4d4d8",
                  borderRadius: 11, padding: 12, fontSize: "0.88em", lineHeight: 1.8,
                  whiteSpace: "pre-wrap", overflowY: "auto", color: "#1a1a1a",
                  direction: "auto",  /* let browser detect output direction */
                }}
                  role="region" aria-label="Amplified prompt result" aria-live="polite">
                  {typed}
                  {!done && <span style={{ animation: "blink 0.8s infinite", color: "#c2410c" }} aria-hidden="true">|</span>}
                </div>

                {/* Score comparison + actions */}
                <div style={{ opacity: done ? 1 : 0, transition: "opacity 0.35s ease", pointerEvents: done ? "auto" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    margin: "10px 0 4px", padding: "8px 0", borderTop: "1px solid #e5e5e3" }} role="status">
                    <Ring score={origA.score} size={32} stroke={3} />
                    <span style={{ color: "#15803d", fontWeight: 800 }} aria-hidden="true">→</span>
                    <Ring score={optA.score} size={32} stroke={3} />
                    <span style={{ fontSize: "0.8em", color: "#15803d", fontWeight: 700 }}>
                      {T.scoreImproved(Math.max(0, optA.score - origA.score))}
                    </span>
                  </div>

                  <div style={{ textAlign: "center", fontSize: "0.78em", color: "#c2410c",
                    fontWeight: 600, marginBottom: 6, minHeight: 22 }} role="status">
                    {cheer || "\u00A0"}
                  </div>

                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <button onClick={handleCopy}
                      aria-label={copied ? T.copiedBtn : T.copyBtn}
                      style={{ flex: 1, padding: "9px", border: "none", borderRadius: 9,
                        fontWeight: 700, fontSize: "0.82em", fontFamily: "inherit", cursor: "pointer",
                        background: copied ? "#15803d" : "#1a1a1a", color: "#fff",
                        transition: "all 0.3s", minWidth: 70 }}>
                      {copied ? T.copiedBtn : T.copyBtn}
                    </button>
                    <button onClick={handleReOptimize} aria-label={T.reOptimizeShort}
                      style={{ padding: "9px 12px", border: "1px solid #c2410c33", borderRadius: 9,
                        fontWeight: 600, fontSize: "0.82em", fontFamily: "inherit", cursor: "pointer",
                        background: "#fef3ec", color: "#c2410c" }}>
                      {nextTier >= 3 ? T.proShort : T.reOptimizeShort}
                    </button>
                    <button onClick={handleShare} aria-label={T.shareBtn}
                      style={{ padding: "9px 12px", border: "1px solid #d4d4d8", borderRadius: 9,
                        fontWeight: 600, fontSize: "0.82em", fontFamily: "inherit", cursor: "pointer",
                        background: "#fff", color: "#555" }}>
                      {T.shareBtn}
                    </button>
                  </div>

                  {/* Paste in AI tools */}
                  <div style={{ marginTop: 10, padding: "10px 0 0", borderTop: "1px solid #e5e5e3" }}
                    role="navigation" aria-label="AI tools">
                    <div style={{ fontSize: "0.7em", color: "#636363", marginBottom: 5,
                      textAlign: "center", fontWeight: 600 }}>
                      {T.pasteLabel}
                    </div>
                    <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
                      {AI_LINKS.map(ai => (
                        <a key={ai.name} href={ai.url} target="_blank" rel="noopener noreferrer"
                          aria-label={`Open ${ai.name} in a new tab`}
                          style={{ display: "flex", alignItems: "center", gap: 4,
                            padding: "6px 12px", borderRadius: 8,
                            border: `1px solid ${ai.color}33`, background: `${ai.color}0a`,
                            color: ai.color, fontSize: "0.76em", fontWeight: 600,
                            textDecoration: "none", fontFamily: "inherit" }}>
                          {ai.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Session count */}
        <div style={{ textAlign: "center", marginTop: 12, fontSize: "0.72em", color: "#636363", height: 20,
          opacity: history.length > 0 ? 1 : 0, transition: "opacity 0.3s" }} role="status">
          {history.length > 0 ? T.sessionCount(history.length) : "\u00A0"}
        </div>
      </main>

      <footer role="contentinfo" style={{ textAlign: "center", padding: "16px",
        borderTop: "1px solid #d4d4d8", fontSize: "0.7em", color: "#636363" }}>
        <span style={{ fontFamily: "'Space Mono', monospace" }}>ECHO.11</span>{" · "}
        <a href="https://shirasarid.substack.com" target="_blank" rel="noopener noreferrer"
          style={{ color: "#c2410c", textDecoration: "underline", fontWeight: 600 }}>Shira Sarid</a>
        {" · "}
        <span>{T.footerTagline}</span>
      </footer>
    </div>
  );
}


// ═══════════════════════════════════════
// ROOT — Language state lives here
// ═══════════════════════════════════════

export default function Echo11App() {
  const [entered, setEntered] = useState(false);
  const [lang, setLang]       = useState(() => detectInitialLang());

  // Sync <html> attributes on every lang change
  useEffect(() => {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    const T = TRANSLATIONS[lang];
    document.documentElement.setAttribute("lang", T.htmlLang);
    document.documentElement.setAttribute("dir",  T.dir);
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang(prev => (prev === "en" ? "he" : "en"));
  }, []);

  const T = TRANSLATIONS[lang];

  return (
    <LangCtx.Provider value={{ lang, T, toggleLang }}>
      {!entered ? <Splash onEnter={() => setEntered(true)} /> : <Tool />}
      <Analytics />
      <SpeedInsights />
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes blink   { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

        /* Responsive grid */
        @media (max-width: 700px) { .echo-grid { grid-template-columns: 1fr !important; } }

        /* Placeholder */
        textarea::placeholder { color: #71717a; }

        /* Focus styles */
        button:hover        { filter: brightness(0.95); }
        button:focus-visible { outline: 2px solid #c2410c; outline-offset: 2px; }
        a:focus-visible      { outline: 2px solid #c2410c; outline-offset: 2px; }
        *:focus              { outline-color: #c2410c; }

        /* RTL-safe textarea — 'direction: auto' lets browser detect Hebrew/English content */
        #prompt-input { direction: auto; }
      `}</style>
    </LangCtx.Provider>
  );
}
