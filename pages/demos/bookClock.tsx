import Papa from 'papaparse';
import { useEffect, useState } from 'react';

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
  // Replace the timestring with a bold version
  return quote.replace(regex, '<strong>$1</strong>');
}

export default function BookClock() {
  const [currentQuote, setCurrentQuote] = useState<BookQuote | null>(null);
  const [quotes, setQuotes] = useState<BookQuote[]>([]);
  const [currentTimeQuotes, setCurrentTimeQuotes] = useState<BookQuote[]>([]);

  useEffect(() => {
    // Load and parse the CSV file
    fetch('/bookQuotes.csv')
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse<BookQuote>(csvText, {
          header: true,
          complete: (results: ParseResult) => {
            setQuotes(results.data);
          },
        });
      });
  }, []);

  useEffect(() => {
    const updateCurrentTimeQuotes = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      const matchingQuotes = quotes.filter(
        (quote) => quote.time === currentTime,
      );
      setCurrentTimeQuotes(matchingQuotes);

      // If we have quotes for this time, select a random one
      if (matchingQuotes.length > 0) {
        const randomIndex = Math.floor(Math.random() * matchingQuotes.length);
        setCurrentQuote(matchingQuotes[randomIndex]);
      }
    };

    // Update the current time quotes every minute
    updateCurrentTimeQuotes();
    const timeInterval = setInterval(updateCurrentTimeQuotes, 60000);

    return () => clearInterval(timeInterval);
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
