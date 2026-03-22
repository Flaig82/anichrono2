/**
 * Basic profanity filter for user-generated content.
 *
 * Checks against a banned word list with word-boundary matching
 * to avoid false positives (e.g. "assassin" won't trigger "ass").
 *
 * Add words to BANNED_WORDS as needed. All matching is case-insensitive.
 */

const BANNED_WORDS = [
  // Slurs & hate speech
  "nigger", "nigga", "faggot", "retard", "retarded", "tranny", "dyke", "kike",
  "spic", "wetback", "chink", "gook", "coon",
  // Common profanity
  "fuck", "fucker", "fucking", "motherfucker", "shit", "shitting", "bullshit",
  "asshole", "bitch", "cunt", "dick", "cock", "pussy", "whore", "slut",
  // Spam / abuse patterns
  "kill yourself", "kys",
];

// Build a single regex with word boundaries for each term
// Some terms are multi-word so we can't rely purely on \b for those
const PATTERN = new RegExp(
  BANNED_WORDS.map((w) =>
    w.includes(" ")
      ? w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // escape regex chars, no \b for phrases
      : `\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`
  ).join("|"),
  "i",
);

/**
 * Returns true if the text contains banned words.
 */
export function containsProfanity(text: string): boolean {
  return PATTERN.test(text);
}

/**
 * Check multiple fields at once. Returns the name of the first field
 * that contains profanity, or null if all clean.
 */
export function checkFieldsForProfanity(
  fields: Record<string, string | null | undefined>,
): string | null {
  for (const [name, value] of Object.entries(fields)) {
    if (value && containsProfanity(value)) {
      return name;
    }
  }
  return null;
}
