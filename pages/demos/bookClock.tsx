import fs from 'fs';
import Papa from 'papaparse';
import path from 'path';
import { useEffect, useRef, useState } from 'react';

interface BookQuote {
  time: string;
  timestring: string;
  quote: string;
  title: string;
  author: string;
}

interface ParseResult {
  data: BookQuote[];
  errors: any[];
  meta: any;
}

function formatQuote(quote: string, timestring: string): string {
  // Create a regex that matches the timestring, case insensitive
  const regex = new RegExp(`(${timestring})`, 'gi');
  // Replace the timestring with a bold and colored version
  return quote.replace(
    regex,
    '<strong class="font-extrabold text-primary dark:text-primary-focus">$1</strong>',
  );
}

export async function getStaticProps() {
  const csvPath = path.join(process.cwd(), 'public', 'bookQuotes.csv');
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const parsedData = Papa.parse<BookQuote>(csvText, {
    header: true,
  });

  return {
    props: {
      quotes: parsedData.data,
    },
  };
}

export default function BookClock({
  quotes: initialQuotes,
}: {
  quotes: BookQuote[];
}) {
  const [currentQuote, setCurrentQuote] = useState<BookQuote | null>(null);
  const [quotes] = useState<BookQuote[]>(initialQuotes);
  const [currentTimeQuotes, setCurrentTimeQuotes] = useState<BookQuote[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const updateCurrentTimeQuotes = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    // Try current time first
    let matchingQuotes = quotes.filter((quote) => quote.time === currentTime);

    // If no quotes found, try the previous minute
    if (matchingQuotes.length === 0) {
      const prevDate = new Date(now.getTime() - 60000); // subtract one minute
      const prevHours = prevDate.getHours().toString().padStart(2, '0');
      const prevMinutes = prevDate.getMinutes().toString().padStart(2, '0');
      const prevTime = `${prevHours}:${prevMinutes}`;

      matchingQuotes = quotes.filter((quote) => quote.time === prevTime);
    }

    setCurrentTimeQuotes(matchingQuotes);

    // If we have quotes, select a random one
    if (matchingQuotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * matchingQuotes.length);
      setCurrentQuote(matchingQuotes[randomIndex]);
    } else {
      setCurrentQuote(null);
    }
  };

  useEffect(() => {
    // Initial update
    updateCurrentTimeQuotes();

    const scheduleNextUpdate = () => {
      const now = new Date();
      const nextMinute = new Date(now);
      nextMinute.setMinutes(now.getMinutes() + 1);
      nextMinute.setSeconds(0);
      nextMinute.setMilliseconds(0);

      const timeUntilNextMinute = nextMinute.getTime() - now.getTime();

      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Schedule the next update
      timerRef.current = setTimeout(() => {
        updateCurrentTimeQuotes();
        scheduleNextUpdate();
      }, timeUntilNextMinute);
    };

    scheduleNextUpdate();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [quotes]);

  useEffect(() => {
    // Update the displayed quote every 20 seconds
    const quoteInterval = setInterval(() => {
      if (currentTimeQuotes.length > 0) {
        const randomIndex = Math.floor(
          Math.random() * currentTimeQuotes.length,
        );
        setCurrentQuote(currentTimeQuotes[randomIndex]);
      }
    }, 20000);

    return () => clearInterval(quoteInterval);
  }, [currentTimeQuotes]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-10 bg-base-100">
      {currentQuote ? (
        <div className="max-w-3xl w-full bg-base-200 rounded-xl shadow-xl p-8 border border-base-300">
          <div
            className="text-2xl mb-8 italic text-base-content font-light leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: `"${formatQuote(
                currentQuote.quote,
                currentQuote.timestring,
              )}"`,
            }}
          />
          <div className="text-right border-t border-base-300 pt-4 mt-8">
            <div className="text-lg text-base-content font-medium">
              {currentQuote.title}
            </div>
            <div className="text-base text-base-content/70 font-light">
              by {currentQuote.author}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center bg-base-200 rounded-xl shadow-xl p-8 border border-base-300">
          <p className="text-xl text-base-content mb-4">Loading quotes...</p>
          <p className="text-sm text-base-content/70">
            {quotes.length > 0
              ? `${quotes.length} quotes loaded`
              : 'No quotes available'}
          </p>
        </div>
      )}
    </div>
  );
}
