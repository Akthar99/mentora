'use client';

import { useState } from 'react';
import { Flashcard } from '@/types';

interface FlashcardViewProps {
  flashcard: Flashcard;
}

export default function FlashcardView({ flashcard }: FlashcardViewProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      onClick={() => setIsFlipped(!isFlipped)}
      className="relative w-full h-80 cursor-pointer perspective-1000"
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        <div className="absolute w-full h-full backface-hidden">
          <div className="w-full h-full bg-white rounded-2xl border-2 border-gray-200 p-8 flex flex-col items-center justify-center shadow-lg">
            <p className="text-sm text-gray-500 mb-4 uppercase tracking-wide font-medium">Question</p>
            <p className="text-xl font-semibold text-gray-900 text-center">{flashcard.question}</p>
            <p className="text-sm text-gray-400 mt-6">Click to flip</p>
          </div>
        </div>

        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <div className="w-full h-full bg-blue-600 rounded-2xl border-2 border-blue-700 p-8 flex flex-col items-center justify-center shadow-lg">
            <p className="text-sm text-blue-200 mb-4 uppercase tracking-wide font-medium">Answer</p>
            <p className="text-xl font-semibold text-white text-center">{flashcard.answer}</p>
            <p className="text-sm text-blue-200 mt-6">Click to flip back</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
