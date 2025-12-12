/**
 * Detects whether user input is a question/conversation or a code generation request
 */

// Question indicators - words/patterns that suggest the user wants an explanation
const QUESTION_PATTERNS = [
  // Direct question words
  /^(what|why|how|when|where|who|which|can you explain|could you explain|please explain)/i,
  /\?$/,  // Ends with question mark

  // Explanation requests
  /explain\s+(this|that|the|how|why|what)/i,
  /tell\s+me\s+(about|how|why|what)/i,
  /describe\s+(this|that|the|how)/i,
  /what\s+(is|are|does|do|did|was|were|would|could|should)/i,
  /how\s+(does|do|did|can|could|would|should|is|are|many|much)/i,
  /why\s+(does|do|did|is|are|was|were|would|could|should)/i,
  /can\s+you\s+(explain|tell|describe|help me understand)/i,

  // Understanding requests
  /help\s+me\s+understand/i,
  /i\s+don'?t\s+understand/i,
  /what'?s\s+the\s+(difference|purpose|reason|point)/i,
  /how\s+does\s+(this|that|it)\s+work/i,

  // About the project/code
  /what\s+(did\s+you|have\s+you)\s+(make|create|build|do|use)/i,
  /how\s+(did\s+you|have\s+you)\s+(make|create|build|do|implement)/i,
  /what\s+(languages?|technologies?|frameworks?|libraries?|tools?)\s+(did|do|are|were)/i,
  /how\s+(many|much)\s+(files?|components?|lines?|functions?)/i,

  // Feature/improvement questions
  /how\s+(can|could|do|would)\s+(i|we)\s+(add|improve|change|modify|update)/i,
  /what\s+(can|could|should)\s+(i|we)\s+(add|improve|change)/i,
  /what\s+(features?|improvements?|changes?)\s+(can|could|should)/i,
  /any\s+(suggestions?|recommendations?|ideas?)/i,

  // General conversational
  /thanks|thank\s+you/i,
  /^(hi|hello|hey)\s*[!.,]?\s*$/i,
  /good\s+(job|work)/i,
];

// Code generation indicators - words/patterns that suggest user wants to build something
const CODE_PATTERNS = [
  // Direct creation requests
  /^(make|create|build|generate|develop|design|implement|code|write)\s+(a|an|the|me|this)?\s*/i,
  /^add\s+(a|an|the)?\s*(new\s+)?(feature|component|page|section|button|form|modal)/i,

  // Modification requests that require code changes
  /^(change|modify|update|fix|refactor|improve|enhance)\s+(the|this|that)?\s*(code|component|page|style|layout|design)/i,

  // Specific UI requests
  /^(add|put|place|insert|include)\s+(a|an|the)?\s*(button|form|input|modal|sidebar|header|footer|navbar|menu)/i,

  // Style/design changes
  /^(make|change)\s+(it|this|the)?\s*(look|style|color|size|bigger|smaller|responsive)/i,

  // Clone/replica requests
  /(clone|replica|copy|like)\s+(of\s+)?(twitter|facebook|instagram|youtube|netflix|spotify|airbnb|uber)/i,
];

export interface DetectionResult {
  isQuestion: boolean;
  confidence: number;
  matchedPattern?: string;
}

/**
 * Analyzes user input to determine if it's a question or code request
 */
export function detectQuestionOrCode(input: string): DetectionResult {
  const trimmedInput = input.trim();

  // Very short inputs are likely questions or greetings
  if (trimmedInput.length < 10 && !CODE_PATTERNS.some(p => p.test(trimmedInput))) {
    return { isQuestion: true, confidence: 0.7, matchedPattern: "short_input" };
  }

  // Check for code patterns first (higher priority)
  for (const pattern of CODE_PATTERNS) {
    if (pattern.test(trimmedInput)) {
      return { isQuestion: false, confidence: 0.9, matchedPattern: pattern.toString() };
    }
  }

  // Check for question patterns
  for (const pattern of QUESTION_PATTERNS) {
    if (pattern.test(trimmedInput)) {
      return { isQuestion: true, confidence: 0.85, matchedPattern: pattern.toString() };
    }
  }

  // Default: assume code generation if no patterns match
  // Most users come to Nova to generate code
  return { isQuestion: false, confidence: 0.5, matchedPattern: "default" };
}

/**
 * Quick check if input is definitely a question
 */
export function isDefinitelyQuestion(input: string): boolean {
  const result = detectQuestionOrCode(input);
  return result.isQuestion && result.confidence >= 0.7;
}
