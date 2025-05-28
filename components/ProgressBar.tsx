import React from 'react';
import { GenerationStep } from '../types';

interface ProgressBarProps {
  currentStep: GenerationStep;
  currentChapterProcessing?: number;
  totalChaptersToProcess?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  currentStep, 
  currentChapterProcessing, 
  totalChaptersToProcess 
}) => {
  let progressMessage: string = currentStep; // Changed type to string
  let percentage = 0;

  const stepOrder = [
    GenerationStep.Idle,
    GenerationStep.UserInput, // Technically not a processing step for progress bar
    GenerationStep.GeneratingOutline,
    GenerationStep.ExtractingCharacters,
    GenerationStep.ExtractingWorldName,
    GenerationStep.ExtractingMotifs,
    GenerationStep.GeneratingChapterPlan,
    GenerationStep.GeneratingChapters,
    GenerationStep.FinalizingTransitions,
    GenerationStep.CompilingBook,
    GenerationStep.Done,
    GenerationStep.Error,
  ];

  const currentStepIndex = stepOrder.indexOf(currentStep);
  const totalMeaningfulSteps = stepOrder.length - 3; // Exclude Idle, UserInput, Error


  if (currentStep === GenerationStep.GeneratingChapters && currentChapterProcessing && totalChaptersToProcess) {
    const basePercentageForChapters = (stepOrder.indexOf(GenerationStep.GeneratingChapters) / totalMeaningfulSteps) * 100;
    const chapterPhasePercentageRange = (stepOrder.indexOf(GenerationStep.FinalizingTransitions) / totalMeaningfulSteps) * 100 - basePercentageForChapters;
    const chapterProgress = (currentChapterProcessing / totalChaptersToProcess) * chapterPhasePercentageRange;
    percentage = basePercentageForChapters + chapterProgress;
    progressMessage = `Generating Chapters: Chapter ${currentChapterProcessing} of ${totalChaptersToProcess}`;
  } else if (currentStepIndex > 0 && currentStep !== GenerationStep.Error && currentStep !== GenerationStep.Done) {
     percentage = (currentStepIndex / totalMeaningfulSteps) * 100;
  } else if (currentStep === GenerationStep.Done) {
    percentage = 100;
  }


  percentage = Math.min(Math.max(percentage, 0), 100);


  return (
    <div className="my-6 w-full">
      <p className="text-sky-300 text-center mb-2 text-lg animate-pulse">{progressMessage}</p>
      {currentStep !== GenerationStep.Idle && currentStep !== GenerationStep.UserInput && currentStep !== GenerationStep.Error && (
        <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-sky-500 to-teal-400 h-4 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      )}
       {currentStep === GenerationStep.Error && (
         <p className="text-red-400 text-center mt-2">An error occurred. Please check the message above.</p>
       )}
    </div>
  );
};

export default ProgressBar;