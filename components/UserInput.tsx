import React from 'react';
import { Button } from './common/Button';
import { TextArea } from './common/TextArea';
import { Input } from './common/Input';
import { MIN_CHAPTERS } from '../constants';

interface UserInputProps {
  storyPremise: string;
  setStoryPremise: (value: string) => void;
  numChapters: number;
  setNumChapters: (value: number) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const UserInput: React.FC<UserInputProps> = ({
  storyPremise,
  setStoryPremise,
  numChapters,
  setNumChapters,
  onSubmit,
  isLoading,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numChapters >= MIN_CHAPTERS) {
      onSubmit();
    } else {
      alert(`Please enter at least ${MIN_CHAPTERS} chapters.`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="storyPremise" className="block text-sm font-medium text-sky-300 mb-1">
          Story Premise
        </label>
        <TextArea
          id="storyPremise"
          value={storyPremise}
          onChange={(e) => setStoryPremise(e.target.value)}
          placeholder="Enter a paragraph describing your story idea (e.g., A young wizard discovers a hidden prophecy that could save or destroy their magical world...)"
          rows={5}
          required
          maxLength={1200} 
          className="bg-slate-700 border-slate-600 focus:ring-sky-500 focus:border-sky-500"
        />
        <p className="text-xs text-slate-400 mt-1">Max 1200 characters. Be descriptive!</p>
      </div>

      <div>
        <label htmlFor="numChapters" className="block text-sm font-medium text-sky-300 mb-1">
          Number of Chapters
        </label>
        <Input
          id="numChapters"
          type="number"
          value={numChapters}
          onChange={(e) => setNumChapters(Math.max(MIN_CHAPTERS, parseInt(e.target.value, 10) || MIN_CHAPTERS))}
          min={MIN_CHAPTERS}
          required
          className="w-full md:w-1/3 bg-slate-700 border-slate-600 focus:ring-sky-500 focus:border-sky-500"
        />
         <p className="text-xs text-slate-400 mt-1">Minimum {MIN_CHAPTERS} chapters.</p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || !storyPremise || numChapters < MIN_CHAPTERS} variant="primary">
          {isLoading ? 'Weaving Your Tale...' : 'Start Weaving'}
        </Button>
      </div>
       <div className="mt-4 p-4 border border-sky-700 bg-sky-900/30 rounded-md text-sm text-slate-300">
        <h4 className="font-semibold text-sky-400 mb-2">How it Works:</h4>
        <ol className="list-decimal list-inside space-y-1">
            <li>Enter your story idea in teaser format (see example below) and the desired number of chapters.
              <br />
              <em className="text-slate-500 text-xs">Example: In technocratic Neo-Babylon, neurosurgeon Alexis created a revolutionary technology: it made it possible to relive the moment of death - safely, virtually, purifyingly. But billionaire Lysander ripped it out of his creator's hands and turned it into a perverse amusement for the rich. First, recordings of real deaths. Then the staged ones. And finally, real murders for hire. Death became elite entertainment. Alexis, learning the truth, teams up with hacker Eve and a group of rebels to destroy Lysander's empire. But can the elite be taken away from what they are now obsessed with?</em>
            </li>
            <li>Our AI will generate a detailed story outline and chapter-by-chapter plan.</li>
            <li>Then, it will write each chapter, performing consistency checks along the way.</li>
            <li>Finally, your complete book draft will be presented!</li>
            <li>Before publication, we recommend a final manual edit to eliminate possible inconsistencies and remove possible technical markup. Re-generation with the same input may give a better result. Save both versions for comparison.</li>
        </ol>
        <p className="mt-3 text-xs text-slate-400">Generation can take several minutes, especially for more chapters. Please be patient.</p>
      </div>
    </form>
  );
};

export default UserInput;
