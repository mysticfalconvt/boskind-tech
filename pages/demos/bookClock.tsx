import Papa from 'papaparse';
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

export default function BookClock() {
  const [currentQuote, setCurrentQuote] = useState<BookQuote | null>(null);
  const [quotes, setQuotes] = useState<BookQuote[]>([]);
  const [currentTimeQuotes, setCurrentTimeQuotes] = useState<BookQuote[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadQuotes = async () => {
      // Check localStorage first
      const cachedQuotes = localStorage.getItem('bookQuotes');
      const lastFetchTime = localStorage.getItem('bookQuotesLastFetch');
      const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      if (
        cachedQuotes &&
        lastFetchTime &&
        Date.now() - Number(lastFetchTime) < oneDay
      ) {
        // Use cached data if it's less than a day old
        setQuotes(JSON.parse(cachedQuotes));
        return;
      }

      try {
        // Fetch with cache control headers
        const response = await fetch('/bookQuotes.csv', {
          headers: {
            'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
          },
        });

        if (!response.ok) throw new Error('Failed to fetch quotes');

        const csvText = await response.text();
        Papa.parse<BookQuote>(csvText, {
          header: true,
          complete: (results: ParseResult) => {
            const parsedQuotes = results.data;
            setQuotes(parsedQuotes);
            // Cache the parsed data
            localStorage.setItem('bookQuotes', JSON.stringify(parsedQuotes));
            localStorage.setItem('bookQuotesLastFetch', Date.now().toString());
          },
        });
      } catch (error) {
        console.error('Error loading quotes:', error);
        // If fetch fails and we have cached data, use that
        if (cachedQuotes) {
          setQuotes(JSON.parse(cachedQuotes));
        }
      }
    };

    loadQuotes();
  }, []);

  const updateCurrentTimeQuotes = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    const matchingQuotes = quotes.filter((quote) => quote.time === currentTime);
    setCurrentTimeQuotes(matchingQuotes);

    // If we have quotes for this time, select a random one
    if (matchingQuotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * matchingQuotes.length);
      setCurrentQuote(matchingQuotes[randomIndex]);
    }
  };

  useEffect(() => {
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

    // Initial update
    updateCurrentTimeQuotes();
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
    <div className="flex flex-col items-center justify-center min-h-screen p-10">
      {currentQuote ? (
        <div className="max-w-3xl w-full bg-base-100 dark:bg-base-200 rounded-lg shadow-lg p-8 border border-base-300 dark:border-base-300">
          <div
            className="text-2xl mb-8 italic text-base-content"
            dangerouslySetInnerHTML={{
              __html: `"${formatQuote(
                currentQuote.quote,
                currentQuote.timestring,
              )}"`,
            }}
          />
          <div className="text-right">
            <div className="text-lg text-base-content">
              {currentQuote.title}
            </div>
            <div className="text-base text-base-content/80">
              by {currentQuote.author}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xl text-base-content">Loading quotes...</p>
      )}
    </div>
  );
}
