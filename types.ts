export interface Character {
  name: string;
  description: string;
  first_appearance: number; // Chapter number
  status: string; // e.g., alive, injured, unknown
  development: Array<{ chapter: number; description: string }>;
  relationships: Record<string, string>; // e.g. { "CharacterName": "Ally" }
  relationships_text?: string; // For storing raw text from LLM if needed
  location: string; // Last known location
  emotional_state: string;
}

export interface ChapterData {
  title?: string; 
  content: string;
  summary?: string;
  timelineEntry?: string; // Raw text from LLM for timeline
  emotionalArcEntry?: string; // Raw text from LLM for emotional arc
  plan?: string; // Individual chapter plan
}

export enum GenerationStep {
  Idle = "Idle",
  UserInput = "Waiting for User Input",
  GeneratingOutline = "Generating Story Outline...",
  ExtractingCharacters = "Extracting Characters from Outline...",
  ExtractingWorldName = "Extracting World Name from Outline...",
  ExtractingMotifs = "Extracting Recurring Motifs from Outline...",
  GeneratingChapterPlan = "Generating Detailed Chapter-by-Chapter Plan...",
  GeneratingChapters = "Generating Chapters...",
  FinalizingTransitions = "Finalizing Chapter Transitions & Openings...",
  CompilingBook = "Compiling Final Book...",
  Done = "Book Generation Complete!",
  Error = "An Error Occurred"
}

// For storing chapter plan parsed from the main chapter plan blob
export interface ParsedChapterPlan {
  title: string;
  summary: string;
  sceneBreakdown: string; // Could be more structured
  characterDevelopmentFocus: string;
  plotAdvancement: string;
  timelineIndicators: string;
  emotionalToneTension: string;
  connectionToNextChapter: string;
}
