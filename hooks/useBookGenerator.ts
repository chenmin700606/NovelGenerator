import { useState, useCallback, useRef } from 'react';
import { Character, ChapterData, GenerationStep, ParsedChapterPlan } from '../types';
import { generateGeminiText } from '../services/geminiService';
import { extractCharactersFromString, extractWorldNameFromString, extractMotifsFromString, parseChapterPlanBlock, extractTimelineInfo, extractEmotionalArcInfo } from '../utils/parserUtils';

const useBookGenerator = () => {
  const [storyPremise, setStoryPremise] = useState<string>('');
  const [numChapters, setNumChapters] = useState<number>(3);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<GenerationStep>(GenerationStep.Idle);
  const [error, setError] = useState<string | null>(null);

  const [currentStoryOutline, setCurrentStoryOutline] = useState<string>('');
  const [currentChapterPlan, setCurrentChapterPlan] = useState<string>('');
  const [characters, setCharacters] = useState<Record<string, Character>>({});
  const [worldName, setWorldName] = useState<string>('');
  const [recurringMotifs, setRecurringMotifs] = useState<string[]>([]);
  const [detailedChapterPlan, setDetailedChapterPlan] = useState<string>('');
  
  const [generatedChapters, setGeneratedChapters] = useState<ChapterData[]>([]);
  const [chapterSummaries, setChapterSummaries] = useState<Record<number, string>>({});
  const [timeline, setTimeline] = useState<Record<number, string>>({}); // Stores raw LLM output
  const [emotionalArc, setEmotionalArc] = useState<Record<number, string>>({}); // Stores raw LLM output
  const [transitions, setTransitions] = useState<Record<number, string>>({}); // chapter_num -> transition text

  const [currentChapterProcessing, setCurrentChapterProcessing] = useState<number>(0);
  const [totalChaptersToProcess, setTotalChaptersToProcess] = useState<number>(0);

  const [finalBookContent, setFinalBookContent] = useState<string | null>(null);
  const [finalMetadataJson, setFinalMetadataJson] = useState<string | null>(null);

  // Use refs for mutable data that doesn't need to trigger re-renders on every change during generation
  const charactersRef = useRef<Record<string, Character>>({});
  const chapterSummariesRef = useRef<Record<number, string>>({});
  const timelineRef = useRef<Record<number, string>>({});
  const emotionalArcRef = useRef<Record<number, string>>({});
  const transitionsRef = useRef<Record<number, string>>({});


  const resetGenerator = useCallback(() => {
    setStoryPremise('');
    setNumChapters(3);
    setIsLoading(false);
    setCurrentStep(GenerationStep.Idle);
    setError(null);
    setCurrentStoryOutline('');
    setCurrentChapterPlan('');
    setCharacters({});
    setWorldName('');
    setRecurringMotifs([]);
    setDetailedChapterPlan('');
    setGeneratedChapters([]);
    setChapterSummaries({});
    setTimeline({});
    setEmotionalArc({});
    setTransitions({});
    setCurrentChapterProcessing(0);
    setTotalChaptersToProcess(0);
    setFinalBookContent(null);
    setFinalMetadataJson(null);

    charactersRef.current = {};
    chapterSummariesRef.current = {};
    timelineRef.current = {};
    emotionalArcRef.current = {};
    transitionsRef.current = {};
  }, []);

  const _getChapterPlanForChapter = useCallback(async (chapterNumber: number, fullPlan: string): Promise<string | null> => {
    const planBlock = parseChapterPlanBlock(fullPlan, chapterNumber);
    if (planBlock) return planBlock;

    // Fallback to LLM if regex fails (as in Python version)
    setCurrentStep(GenerationStep.GeneratingChapterPlan); // Or a more specific sub-step
    const fallbackPrompt = `From the FULL DETAILED CHAPTER PLAN below, extract ONLY the complete plan section for Chapter ${chapterNumber}.
Ensure you include everything between its '--- START CHAPTER ${chapterNumber} PLAN ---' and '--- END CHAPTER ${chapterNumber} PLAN ---' markers.

FULL DETAILED CHAPTER PLAN:
${fullPlan}

Respond ONLY with the plan for Chapter ${chapterNumber}. Do not add any other text.`;
    try {
      return await generateGeminiText(fallbackPrompt, "You are a data extraction assistant.");
    } catch (e) {
      console.error(`Error extracting plan for Chapter ${chapterNumber} via LLM fallback:`, e);
      return null;
    }
  }, []);


  const startGeneration = useCallback(async (premise: string, chaptersCount: number) => {
    resetGenerator(); // Reset state before starting
    setStoryPremise(premise);
    setNumChapters(chaptersCount);
    setIsLoading(true);
    setError(null);
    setTotalChaptersToProcess(chaptersCount);

    try {
      // 1. Create Story Outline
      setCurrentStep(GenerationStep.GeneratingOutline);
      const systemPromptOutline = `You are a professional novelist and editor. 
You excel at creating compelling story outlines that maintain coherence and proper narrative structure.
Pay special attention to character development, consistent world-building, and logical plot progression.`;
      const promptOutline = `Based on the following story premise, create a detailed story outline for a ${chaptersCount}-chapter book.

Story premise: ${premise}

For each chapter, provide:
1. A chapter title (e.g., Chapter 1: The Unexpected Summons)
2. Key plot events (3-5 bullet points with specific details of what happens)
3. Character development points (which characters appear, what they learn, how they change or react)
4. Setting/location details (be specific and consistent, e.g., "The Obsidian Spire - Throne Room")

Also create a section titled "WORLD BUILDING DETAILS" with:
1. The name of the main world/city/setting (create a unique, memorable name fitting the story's tone)
2. Key locations that will appear multiple times (e.g., The Sunken Library, The Whispering Woods)
3. Important technology, magic system, or cultural elements (e.g., Aether-powered airships, The Five Great Clans)

Then create a section titled "MAIN CHARACTERS" with:
1. Main protagonist (name, detailed physical description, core personality traits, primary motivation, overall character arc)
2. Main antagonist (name, detailed physical description, core personality traits, primary motivation, methods)
3. Key supporting characters (for each: name, brief description, role, connection to protagonist/antagonist)

Also create a section titled "RECURRING MOTIFS/THEMES" with 3-5 symbols, objects, phrases, or abstract themes that will recur throughout the story to provide thematic continuity (e.g., A broken locket, The theme of betrayal and redemption).

The outline should have a clear beginning, middle, and end structure.
Ensure proper rising action, climax, and resolution.
For the climax chapters (e.g., chapters ${Math.max(1, chaptersCount - 2)} and ${Math.max(1, chaptersCount - 1)}), provide extra detail.
Make sure all character names, settings, and plot elements remain 100% consistent throughout this outline.
The entire output should be a single, coherent text document.`;
      const outlineText = await generateGeminiText(promptOutline, systemPromptOutline);
      if (!outlineText) throw new Error("Failed to generate story outline.");
      setCurrentStoryOutline(outlineText);

      // 2. Extract Characters, World Name, Motifs from Outline
      setCurrentStep(GenerationStep.ExtractingCharacters);
      const extractedChars = await extractCharactersFromString(outlineText, generateGeminiText);
      setCharacters(extractedChars);
      charactersRef.current = extractedChars;

      setCurrentStep(GenerationStep.ExtractingWorldName);
      const extractedWorldName = await extractWorldNameFromString(outlineText, generateGeminiText);
      setWorldName(extractedWorldName);
      
      setCurrentStep(GenerationStep.ExtractingMotifs);
      const extractedMotifs = await extractMotifsFromString(outlineText, generateGeminiText);
      setRecurringMotifs(extractedMotifs);

      // 3. Create Detailed Chapter Plan
      setCurrentStep(GenerationStep.GeneratingChapterPlan);
      const systemPromptPlan = `You are an expert story planner and editor. Your task is to break down a story outline into a highly detailed, actionable chapter-by-chapter plan.`;
      const chapterPlanPrompt = `Based on the provided STORY OUTLINE, create a VERY detailed chapter-by-chapter plan.

STORY OUTLINE:
${outlineText}

For EACH chapter (1 through ${chaptersCount}), format its plan EXACTLY as follows, ensuring each part is clearly delineated:

--- START CHAPTER {{{{Chapter Number}}}} PLAN ---
Title: [Concise and evocative chapter title from the outline, or create one if missing]
Chapter Summary (approx. 150-250 words): [Detailed summary of this chapter's main events, character actions, key decisions, and critical outcomes. Explain how it advances the plot.]
Scene Breakdown:
    - Scene 1: Location: [Specific location]. Characters Present: [List all characters]. Scene Objective: [What is the main goal of this scene?]. Key Events/Interactions: [Bullet points of what happens, key dialogue snippets or topics, actions taken]
    - Scene 2: Location: [...]. Characters Present: [...]. Scene Objective: [...]. Key Events/Interactions: [...]
    (Add more scenes as necessary to cover the chapter's content from the outline)
Character Development Focus:
    - [Character Name]: [Specific development this character undergoes, e.g., learns a new skill, makes a crucial decision, faces an internal conflict, relationship changes]
    - [Another Character Name (if applicable)]: [...]
Plot Advancement: [Clearly state what key plot points are introduced, developed, or resolved in this chapter. How does it move the overall story forward towards the climax/resolution?]
Timeline Indicators: [e.g., "Evening of the same day", "Three days after Chapter X", "Mid-morning, Festival of a Thousand Lanterns". Be specific if possible.]
Emotional Tone & Tension: [Describe the prevailing emotional tone of the chapter (e.g., suspenseful, hopeful, somber). State the tension level at the chapter's end (e.g., High - cliffhanger, Medium - unresolved question, Low - moment of peace).]
Connection to Next Chapter (Hook/Transition): [How does this chapter end to create anticipation or a smooth transition into the next? Mention a specific hook, question, or foreshadowing element.]
--- END CHAPTER {{{{Chapter Number}}}} PLAN ---

Ensure every chapter from 1 to ${chaptersCount} has a plan in this exact format.
Be extremely specific and detailed. This plan is critical for ensuring narrative consistency and will be used directly for chapter generation.
Do not add any commentary outside of the plan structure for each chapter.`;
      const detailedPlanText = await generateGeminiText(chapterPlanPrompt, systemPromptPlan);
      if (!detailedPlanText || !detailedPlanText.includes("--- START CHAPTER 1 PLAN ---")) {
        throw new Error("Failed to generate a valid and parseable chapter plan.");
      }
      setDetailedChapterPlan(detailedPlanText);
      setCurrentChapterPlan(detailedPlanText);


      // 4. Generate Chapters
      setCurrentStep(GenerationStep.GeneratingChapters);
      const tempGeneratedChapters: ChapterData[] = [];

      for (let i = 1; i <= chaptersCount; i++) {
        setCurrentChapterProcessing(i);
        
        const systemPromptWriter = `You are a celebrated novelist known for writing engaging, coherent chapters 
with natural flow, rich description, and strong character development. Your chapters have clear narrative structure and 
maintain perfect consistency with previously established plot elements, character arcs, and the detailed chapter plan provided.`;

        let previousChaptersSummaryText = "";
        for (let j = 1; j < i; j++) {
            if (chapterSummariesRef.current[j]) {
                previousChaptersSummaryText += `Summary of Chapter ${j}:\n${chapterSummariesRef.current[j]}\n\n`;
            }
        }

        let charactersSoFarText = Object.values(charactersRef.current).map(c => `- ${c.name}: Desc: ${c.description}. Status: ${c.status}. Recent Dev: ${c.development.slice(-1)[0]?.description || 'N/A'}`).join('\n');
        if (!charactersSoFarText) charactersSoFarText = "No character data tracked yet.";

        let timelineContextText = i > 1 && timelineRef.current[i-1] ? `Previous chapter (${i-1}) ended at/around: ${extractTimelineInfo(timelineRef.current[i-1]).endTimeOfChapter}` : "N/A";
        let emotionalContextText = i > 1 && emotionalArcRef.current[i-1] ? `End of previous chapter (${i-1}) emotional state:\n${emotionalArcRef.current[i-1]}` : "N/A";
        
        const thisChapterPlanText = await _getChapterPlanForChapter(i, detailedPlanText);
        if (!thisChapterPlanText) throw new Error(`Could not retrieve plan for Chapter ${i}.`);
        
        // Extract title from plan for chapter data
        const plannedTitleMatch = thisChapterPlanText.match(/Title:\s*(.*)/);
        const plannedTitle = plannedTitleMatch ? plannedTitleMatch[1].trim() : `Chapter ${i}`;


        let chapterOpenerText = "";
        if (i > 1) {
          const prevChapterSummary = chapterSummariesRef.current[i-1] || "No summary for previous chapter.";
          const endOfPrevChapterText = transitionsRef.current[i-1] || "Previous chapter ended."; // Use stored transition
          const prevEmotionalStatus = emotionalArcRef.current[i-1] || "Unknown emotional state.";
          const prevEndTime = timelineRef.current[i-1] ? extractTimelineInfo(timelineRef.current[i-1]).endTimeOfChapter : "Not specified";

          const openerPrompt = `Create a compelling opening paragraph (or two, 3-6 sentences total) for Chapter ${i} titled "${plannedTitle}".
This opening must connect seamlessly with the end of Chapter ${i - 1}.

SUMMARY OF PREVIOUS CHAPTER (${i - 1}):
${prevChapterSummary}
        
ACTUAL ENDING TEXT OF PREVIOUS CHAPTER (${i - 1}):
${endOfPrevChapterText}
        
EMOTIONAL STATE AT END OF PREVIOUS CHAPTER (${i - 1}):
${prevEmotionalStatus}
        
TIME AT END OF PREVIOUS CHAPTER (${i - 1}):
${prevEndTime}
        
PLAN FOR THIS CHAPTER (${i}, "${plannedTitle}"):
${thisChapterPlanText}
        
The opening paragraph(s) should:
1. Establish a clear temporal and situational connection to the end of the previous chapter.
2. Smoothly transition from the previous chapter's hook or unresolved tension.
3. Quickly orient readers in the current scene (location, characters present, immediate situation) as per THIS CHAPTER'S PLAN.
4. Avoid redundant summarization.
5. Set the initial emotional tone and focus for this chapter, aligning with its plan.
Generate ONLY the 1-2 opening paragraphs for Chapter ${i}. Do not write "Chapter X begins..." Just write the prose.`;
          chapterOpenerText = await generateGeminiText(openerPrompt, "You are a master storyteller specializing in chapter openings.");
        }
        
        let motifInstructionText = "";
        if (recurringMotifs.length > 0) {
            const chosenMotif = recurringMotifs[(i - 1) % recurringMotifs.length];
            motifInstructionText = `Subtly weave in the recurring motif/theme of '${chosenMotif}' if it fits naturally.`;
        }

        const chapterGenPrompt = `Write Chapter ${i} of a novel, titled "${plannedTitle}".

STORY PREMISE: ${premise}
WORLD NAME: ${worldName || "Not specified, maintain consistency if you introduce one."}
OVERALL STORY OUTLINE (for broader context): ${outlineText.substring(0,1500)}...
CHARACTERS IN THIS STORY: ${charactersSoFarText}
SUMMARY OF PREVIOUS CHAPTERS (if any): ${previousChaptersSummaryText || "This is the first chapter."}
TIMELINE CONTEXT (from end of previous chapter): ${timelineContextText}
EMOTIONAL CONTEXT (from end of previous chapter): ${emotionalContextText}

DETAILED PLAN FOR THIS SPECIFIC CHAPTER (${i}, "${plannedTitle}"):
${thisChapterPlanText}
IT IS ABSOLUTELY CRUCIAL that you meticulously follow THIS CHAPTER'S DETAILED PLAN. All specified plot events, character actions/development, scene descriptions/objectives, timeline progression, and emotional tone described in this plan MUST be accurately and fully implemented. Do not deviate.

SUGGESTED CHAPTER OPENING (if not Chapter 1, integrate this as the start of the chapter's prose, right after the title):
${chapterOpenerText || (i === 1 ? "This is Chapter 1, start fresh based on plan." : "No specific opener generated, start based on plan, connecting to previous chapter.")}

${motifInstructionText}

GUIDELINES:
- Start with the chapter title: "${plannedTitle}". Then, if an opener is provided, use it. Otherwise, begin the prose.
- Write a complete chapter (approx 2500-3500 words, prioritize plan fulfillment).
- Include rich descriptions, dialogue, character interactions/thoughts, aligned with the plan.
- Maintain consistent tone, voice, and personalities.
- This is Chapter ${i} of ${chaptersCount}.
- Avoid redundant exposition.
- Ensure every element from THIS CHAPTER'S DETAILED PLAN is fully incorporated.
- The end of the chapter should lead into the "Connection to Next Chapter (Hook/Transition)" specified in its plan.

Format with proper paragraphing and dialogue. Begin with the chapter title on its own line, then the chapter content.`;

        let chapterContent = await generateGeminiText(chapterGenPrompt, systemPromptWriter);
        if (!chapterContent) throw new Error(`Failed to generate content for Chapter ${i}.`);

        // Consistency Check & Fix (Simplified loop from Python)
        const maxFixAttempts = 1; // Python had 2, reducing for web performance
        for (let fixAttempt = 0; fixAttempt < maxFixAttempts; fixAttempt++) {
            const consistencySystemPrompt = `You are a meticulous literary editor specializing in narrative consistency.
Your job is to identify and flag any inconsistencies in a narrative chapter compared to established information.`;
            const consistencyPrompt = `Analyze this DRAFT of Chapter ${i} ("${plannedTitle}") for consistency issues compared to the established narrative context AND its own detailed plan.

STORY PREMISE: ${premise}
WORLD NAME: ${worldName}
ESTABLISHED NARRATIVE CONTEXT (Summaries of Chapters 1-${i-1}, Character Statuses, Timeline):
${previousChaptersSummaryText}
${Object.values(charactersRef.current).filter(c => c.first_appearance > 0 && c.first_appearance < i).map(c => `- ${c.name}: Status: ${c.status}. Loc: ${c.location}. Dev: ${c.development.slice(-1)[0]?.description || 'N/A'}`).join('\n')}
${Object.entries(timelineRef.current).filter(([key]) => parseInt(key) < i).map(([key, val]) => `Ch ${key} ended: ${extractTimelineInfo(val).endTimeOfChapter}`).join('\n')}

DETAILED PLAN FOR THIS CHAPTER (${i}, "${plannedTitle}"):
${thisChapterPlanText}

CURRENT CHAPTER ${i} DRAFT CONTENT:
${chapterContent}

Identify ANY inconsistencies (Character, Plot, Setting, Timeline, Motif, Unexplained elements, Deviation from Plan).
If ANY inconsistencies, list them. Otherwise, respond ONLY with "CONSISTENT". Be very critical.`;
            
            const consistencyCheckResult = await generateGeminiText(consistencyPrompt, consistencySystemPrompt);
            if (consistencyCheckResult.toUpperCase().includes("CONSISTENT")) {
                break; 
            } else {
                if (fixAttempt < maxFixAttempts -1) { // Only fix if not the last attempt
                    const fixPromptSystem = `You are a professional novelist and meticulous editor. Revise a chapter draft to fix all identified consistency issues while preserving narrative intent and adhering to the plan.`;
                    const fixPrompt = `Rewrite DRAFT of Chapter ${i} ("${plannedTitle}") to fix ALL identified issues.
Ensure rewritten chapter fully executes "THIS CHAPTER'S DETAILED PLAN" and is consistent with PREVIOUS CHAPTERS' info.

STORY PREMISE: ${premise}
WORLD NAME: ${worldName}
PREVIOUS CHAPTERS' CONTEXT: (As above)
DETAILED PLAN FOR THIS CHAPTER (${i}, "${plannedTitle}"): ${thisChapterPlanText}
ORIGINAL DRAFT OF CHAPTER ${i}: ${chapterContent}
IDENTIFIED CONSISTENCY ISSUES TO FIX: ${consistencyCheckResult}

Rewrite the entire chapter, starting with title "${plannedTitle}".`;
                    const fixedContent = await generateGeminiText(fixPrompt, fixPromptSystem);
                    if (fixedContent) chapterContent = fixedContent;
                }
            }
        }
        
        // Update Trackers
        const summaryPrompt = `Create a detailed summary (200-300 words) of Chapter ${i} ("${plannedTitle}"). Include key plot developments, character actions/decisions/development, setting details, important dialogue/revelations, emotional tone shifts, and connections to previous events. Focus on factual recall.
CHAPTER CONTENT:
${chapterContent}`;
        chapterSummariesRef.current[i] = await generateGeminiText(summaryPrompt, "You are a literary analyst specializing in narrative structure.");
        
        // Simplified character update from Python - assumes LLM can parse and format correctly
        const charUpdatePrompt = `Based on Chapter ${i} ("${plannedTitle}") content, track development/status of characters: ${Object.keys(charactersRef.current).join(', ')}.
For each character from master list actively appearing or significantly mentioned in THIS chapter, provide:
1. Current status (alive, injured, etc.).
2. Key development/actions.
3. New/changed relationships.
4. Current location at chapter end.
5. Emotional state at chapter end.
Format as: CHARACTER NAME: status | development/actions | relationships | location | emotional_state
If a character doesn't appear, omit. If info missing, use "not specified". Be concise.
CHAPTER CONTENT:
${chapterContent}`;
        const charUpdatesText = await generateGeminiText(charUpdatePrompt, "You are a narrative continuity expert for character tracking.");
        // Basic parsing of charUpdatesText (could be improved with regex from parserUtils)
        charUpdatesText.split('\n').forEach(line => {
            const parts = line.split(':');
            if (parts.length > 1) {
                const name = parts[0].trim();
                if (charactersRef.current[name]) {
                    const details = parts[1].split('|').map(p => p.trim());
                    if (details.length === 5) {
                        charactersRef.current[name].status = details[0];
                        charactersRef.current[name].development.push({ chapter: i, description: details[1] });
                        // charactersRef.current[name].relationships = ... (more complex parsing needed)
                        charactersRef.current[name].location = details[3];
                        charactersRef.current[name].emotional_state = details[4];
                        if (charactersRef.current[name].first_appearance === 0) charactersRef.current[name].first_appearance = i;
                    }
                }
            }
        });


        const timelinePrompt = `Based on Chapter ${i} ("${plannedTitle}") content, determine:
1. Time passed DURING chapter.
2. Specific time/date at END of chapter.
3. Any specific time markers/dates/durations mentioned.
Reply in format: TIME_ELAPSED_IN_CHAPTER: [...] END_TIME_OF_CHAPTER: [...] SPECIFIC_TIME_MARKERS_MENTIONED: [...]
CHAPTER CONTENT:
${chapterContent}`;
        timelineRef.current[i] = await generateGeminiText(timelinePrompt, "You are a literary analyst for temporal structure.");

        const emotionalArcPrompt = `Analyze emotional tone/tension at END of Chapter ${i} ("${plannedTitle}"):
1. Primary emotion evoked at chapter's very end.
2. Narrative tension level at chapter's end (1-10, 10=high).
3. Primary unresolved question/conflict/hook.
Reply: PRIMARY_ENDING_EMOTION: [...] TENSION_LEVEL_AT_END: [...] UNRESOLVED_HOOK_OR_QUESTION: [...]
CHAPTER CONTENT (focus on ending):
${chapterContent.slice(-1500)}`; // Analyze last part
        emotionalArcRef.current[i] = await generateGeminiText(emotionalArcPrompt, "You are a literary analyst for emotional arcs.");

        if (i < chaptersCount) {
            const nextChapterPlanText = await _getChapterPlanForChapter(i + 1, detailedPlanText);
            const transitionPrompt = `Create a compelling transition (1-2 paragraphs) for the VERY END of Chapter ${i} ("${plannedTitle}").
This transition should create anticipation for Chapter ${i + 1} (plan provided below).

LAST ~500 CHARS OF CURRENT CHAPTER ${i}: ${chapterContent.slice(-500)}
PLAN FOR NEXT CHAPTER (${i + 1}): ${nextChapterPlanText || "Next chapter continues the story."}
EMOTIONAL STATE AT CURRENT CHAPTER'S END (before this new transition): ${emotionalArcRef.current[i]}
TIMELINE INFO AT CURRENT CHAPTER'S END: ${timelineRef.current[i]}
RECURRING MOTIF (optional, weave subtly): ${recurringMotifs.length > 0 ? recurringMotifs[i % recurringMotifs.length] : "None"}
        
Transition should provide closure but leave reader wanting more, create strong hook/suspense/foreshadowing for Ch ${i+1}.
Generate ONLY the 1-2 transition paragraphs. These will replace original final paragraphs of Chapter ${i}.`;
            const transitionText = await generateGeminiText(transitionPrompt, "You are a master storyteller for chapter endings.");
            if (transitionText) {
                transitionsRef.current[i] = transitionText;
                // Replace last part of chapterContent with transitionText (simplified)
                const contentParts = chapterContent.split('\n\n');
                const numParasInTransition = transitionText.split('\n\n').length;
                if (contentParts.length > numParasInTransition) {
                    chapterContent = contentParts.slice(0, -numParasInTransition).join('\n\n') + '\n\n' + transitionText;
                } else {
                    chapterContent += '\n\n' + transitionText; // Append if chapter too short
                }
            }
        }
        
        tempGeneratedChapters.push({ title: plannedTitle, content: chapterContent, plan: thisChapterPlanText });
        setGeneratedChapters([...tempGeneratedChapters]); // Update UI progressively
      }
      setGeneratedChapters(tempGeneratedChapters); // Final update with all chapters

      // 5. Final check on transitions and openings (Simplified: Python logic is complex, doing a light pass)
      setCurrentStep(GenerationStep.FinalizingTransitions);
      // This part is highly iterative and complex in Python. For web, a full re-gen of openings/endings
      // might be too slow. The chapter gen already tries to make good openings/endings.
      // A full implementation of `check_chapter_transitions_and_openings_final` would involve more LLM calls
      // and careful text manipulation. For now, we'll assume the per-chapter generation is sufficient.

      // 6. Compile Book
      setCurrentStep(GenerationStep.CompilingBook);
      const titlePrompt = `Create a compelling and marketable title for a book with premise: "${premise}" and outline snippet: "${outlineText.substring(0,500)}...". World: "${worldName}". Reply ONLY with book title.`;
      let bookTitle = await generateGeminiText(titlePrompt, "You are a book titling expert.");
      bookTitle = bookTitle.trim().replace("#","") || `A Novel: ${premise.substring(0,30)}...`;

      let fullBookText = `# ${bookTitle}\n\n`;
      fullBookText += `## Story Premise\n\n${premise}\n\n`;
      fullBookText += `## World: ${worldName || 'Unnamed World'}\n\n`;
      
      tempGeneratedChapters.forEach((chap, idx) => {
          // Chapter content should already start with its title from generation
          fullBookText += `\n\n---\n\n${chap.content}\n\n`;
      });
      setFinalBookContent(fullBookText);

      const metadata = {
        title: bookTitle,
        story_premise: premise,
        num_chapters_generated: tempGeneratedChapters.length,
        target_num_chapters: chaptersCount,
        world_name: worldName,
        story_outline_preview: outlineText.substring(0, 2000) + "...",
        chapter_plan_preview: detailedPlanText.substring(0, 2000) + "...",
        characters: charactersRef.current,
        chapter_summaries: chapterSummariesRef.current,
        recurring_motifs: recurringMotifs,
        timeline_data_by_chapter: timelineRef.current,
        emotional_arc_data_by_chapter: emotionalArcRef.current,
        generation_timestamp: new Date().toISOString(),
        model_used: "gemini-2.5-flash-preview-04-17" // from constants
      };
      setFinalMetadataJson(JSON.stringify(metadata, null, 2));

      setCurrentStep(GenerationStep.Done);
    } catch (e: any) {
      console.error("Book generation failed:", e);
      setError(e.message || "An unknown error occurred during book generation.");
      setCurrentStep(GenerationStep.Error);
    } finally {
      setIsLoading(false);
      setCurrentChapterProcessing(0);
    }
  }, [resetGenerator, _getChapterPlanForChapter, worldName, recurringMotifs]); // Add other stable dependencies as needed

  return {
    storyPremise, setStoryPremise,
    numChapters, setNumChapters,
    isLoading, currentStep, error,
    startGeneration,
    finalBookContent,
    finalMetadataJson,
    generatedChapters, // For UI display during generation
    currentChapterProcessing,
    totalChaptersToProcess,
    resetGenerator,
    currentStoryOutline,
    currentChapterPlan,
  };
};

export default useBookGenerator;
