import React from 'react';
import useBookGenerator from './hooks/useBookGenerator';
import { GenerationStep } from './types';
import UserInput from './components/UserInput';
import ProgressBar from './components/ProgressBar';
import BookDisplay from './components/BookDisplay';
import { LoadingSpinner } from './components/common/LoadingSpinner';

const App: React.FC = () => {
  const {
    storyPremise,
    setStoryPremise,
    numChapters,
    setNumChapters,
    startGeneration,
    isLoading,
    currentStep,
    error,
    finalBookContent,
    finalMetadataJson,
    generatedChapters,
    currentChapterProcessing,
    totalChaptersToProcess,
    resetGenerator,
    currentStoryOutline,
    currentChapterPlan,
  } = useBookGenerator();

  const handleStartGeneration = () => {
    if (storyPremise && numChapters >= 3) {
      startGeneration(storyPremise, numChapters);
    } else {
      // Basic validation feedback, can be improved
      alert("Please provide a story premise and at least 3 chapters.");
    }
  };

  const handleReset = () => {
    resetGenerator();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-sky-900 text-slate-100 flex flex-col items-center p-4 md:p-8 selection:bg-sky-500 selection:text-white">
      <header className="w-full max-w-4xl mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-400 py-2">
          NovelGenerator
        </h1>
        <p className="text-slate-400 mt-2 text-sm md:text-base">
          <strong className="text-slate-300">Become an author. Before your coffee gets cold.</strong> <br /><strong className="text-slate-300">Turn ideas into books. With one prompt.</strong>
        </p>
      </header>

      <main className="w-full max-w-4xl bg-slate-800 shadow-2xl rounded-lg p-6 md:p-8">
        {error && (
          <div className="mb-4 p-4 bg-red-700 border border-red-500 text-white rounded-md">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
            <button
              onClick={handleReset}
              className="mt-2 px-3 py-1 bg-red-500 hover:bg-red-400 rounded text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {currentStep === GenerationStep.Idle && !finalBookContent && (
          <UserInput
            storyPremise={storyPremise}
            setStoryPremise={setStoryPremise}
            numChapters={numChapters}
            setNumChapters={setNumChapters}
            onSubmit={handleStartGeneration}
            isLoading={isLoading}
          />
        )}

        {isLoading && currentStep !== GenerationStep.Idle && (
          <div className="text-center">
            <LoadingSpinner />
            <ProgressBar
              currentStep={currentStep}
              currentChapterProcessing={currentChapterProcessing}
              totalChaptersToProcess={totalChaptersToProcess}
            />
            {currentStep === GenerationStep.GeneratingOutline && currentStoryOutline && (
              <div className="mt-4 p-4 bg-slate-700 rounded-md max-h-60 overflow-y-auto text-left">
                <h3 className="font-semibold mb-2 text-sky-400">Story Outline (In Progress):</h3>
                <pre className="whitespace-pre-wrap text-sm text-slate-300">{currentStoryOutline.slice(0,1000)}...</pre>
              </div>
            )}
            {currentStep === GenerationStep.GeneratingChapterPlan && currentChapterPlan && (
              <div className="mt-4 p-4 bg-slate-700 rounded-md max-h-60 overflow-y-auto text-left">
                <h3 className="font-semibold mb-2 text-sky-400">Chapter Plan (In Progress):</h3>
                <pre className="whitespace-pre-wrap text-sm text-slate-300">{currentChapterPlan.slice(0,1000)}...</pre>
              </div>
            )}
            {currentStep === GenerationStep.GeneratingChapters && generatedChapters.length > 0 && (
               <div className="mt-4 p-4 bg-slate-700 rounded-md max-h-60 overflow-y-auto text-left">
                <h3 className="font-semibold mb-2 text-sky-400">Generated Chapters Progress:</h3>
                <ul className="list-disc list-inside text-sm text-slate-300">
                  {generatedChapters.map((ch, idx) => (
                    <li key={idx}>Chapter {idx + 1}: {ch.title || `Generating...`} ({(ch.content?.length || 0) > 0 ? 'Content generated' : 'Pending'})</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!isLoading && finalBookContent && finalMetadataJson && (
          <BookDisplay
            bookContent={finalBookContent}
            metadataJson={finalMetadataJson}
            onReset={handleReset}
          />
        )}
      </main>
      <footer className="w-full max-w-4xl mt-8 text-center text-slate-500 text-xs">
        <p>&copy; {new Date().getFullYear()} <a href="https://github.com/KazKozDev" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 transition-colors">KazKozDev</a></p>
      </footer>
    </div>
  );
};

export default App;
