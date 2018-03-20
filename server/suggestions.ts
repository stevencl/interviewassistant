// No guidance responses
export const COMMUNICATION_CONFIRM = "Communication.Confirm";
export const NONE = "None";

// Guidance on questions
export const LEADING_QUESTION = "LeadingQuestions";
export const LEADING_QUESTION_SUGGESTION = "This is a leading question. Rephrase as: \"How do you feel...\"";
export const CLOSED_QUESTION = "YesNoQuestions";
export const CLOSED_QUESTION_SUGGESTION = "This is a closed question. Follow up with: \"Tell me more...\"";

// Guidance on JTBD
export const JTBD_HOW = "JTBD_How";
export const JTBD_HOWMUCH = "JTBD_HowMuch";
export const JTBD_WHERE = "JTBD_Where";
export const JTBD_WHY = "JTBD_Why";
export const JTBD_WHEN = "JTBD_When";
export const JTBD_WHOWHAT = "JTBD_Who/What";
export const JTBD_SUGGESTION = "This is a Job-To-Be-Done. Ask: \"If you get better what will you gain?\""; 

// Guidance on problems
export const PROBLEM_HOW = "Problem_How";
export const PROBLEM_WHERE = "Problem_Where";
export const PROBLEM_HOWMUCH = "Problem_HowMuch";
export const PROBLEM_WHY = "Problem_Why";
export const PROBLEM_WHEN = "Problem_When";
export const PROBLEM_WHOWHAT = "Problem_Who/What";
export const PROBLEM_SUGGESTION = "This is a problem. Ask for more details";
export const DEFAULT_SUGGESTION = "Rephrasing or following up can lead to a more vivid conversation.";

// Thresholds to return suggestions
export const PRIMARY_SUGGESTION_THRESHOLD = 0.6;
export const PRIMARY_QUESTION_SUGGESTION_THRESHOLD = 0.5;
export const SECONDARY_SUGGESTION_THRESHOLD = 0.5;
export const SECONDARY_QUESTION_SUGGESTION_THRESHOLD = 0.4;