import { useLocalStorage } from '@mantine/hooks';
import pako from 'pako';
import { useState } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  githubGist,
  monokai,
} from 'react-syntax-highlighter/dist/cjs/styles/hljs';

// URL conversion utilities
const base64ToUrl = (data: string) =>
  data.replace(/\//g, '_').replace(/\+/g, '-');

const urlToBase64 = (data: string) =>
  data.replace(/_/g, '/').replace(/-/g, '+');

const uint8ArrayToBase64 = (data: Uint8Array): string => {
  const utf8String = data.reduce((acc, n) => acc + String.fromCharCode(n), '');
  const percentEncodedUtf8String = encodeURIComponent(utf8String);
  const binaryString = percentEncodedUtf8String.replace(
    /%([0-9A-F]{2})/g,
    (_, p1) => String.fromCharCode(parseInt(p1, 16)),
  );
  const base64Encoded = btoa(binaryString);
  return base64Encoded;
};

const base64ToUint8Array = (base64Encoded: string): Uint8Array => {
  const binaryString = atob(base64Encoded);
  const percentEncodedUtf8String = Array.prototype.map
    .call(
      binaryString,
      (char: string) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`,
    )
    .join('');
  const utf8String = decodeURIComponent(percentEncodedUtf8String);
  const data = utf8String.split('').map((char) => char.charCodeAt(0));
  return Uint8Array.from(data);
};

const uint8ArrayToUrl = (data: Uint8Array) =>
  base64ToUrl(uint8ArrayToBase64(data));

const urlToUint8Array = (base64Encoded: string) =>
  base64ToUint8Array(urlToBase64(base64Encoded));

export default function DesignerParse() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [decodedContent, setDecodedContent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [themeStorage] = useLocalStorage({
    key: 'theme',
    defaultValue: 'winter',
  });

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setError(null);
      setDecodedContent(null);

      try {
        const text = await file.text();
        const u8 = urlToUint8Array(text);
        const uncompressed = pako.inflate(u8, { to: 'string' });
        const result = JSON.parse(uncompressed || '{}');
        setDecodedContent(result);
      } catch (err) {
        console.error('Error processing file:', err);
        setError(err instanceof Error ? err.message : 'Failed to process file');
      }
    }
  };

  return (
    <div className="flex flex-col p-10 bg-base-100">
      <div className="w-full bg-base-200 rounded-xl shadow-xl p-8 border border-base-300">
        {!decodedContent && (
          <h1 className="text-2xl font-bold text-base-content mb-6">
            Designer File Parser
          </h1>
        )}

        {!selectedFile ? (
          <div className="mb-6">
            <label
              htmlFor="file-upload"
              className="block w-full p-4 text-center border-2 border-dashed border-base-300 rounded-lg cursor-pointer hover:border-primary transition-colors"
            >
              <div className="flex flex-col items-center">
                <svg
                  className="w-8 h-8 mb-2 text-base-content/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-base-content">
                  Click to upload or drag and drop
                </span>
                <span className="text-sm text-base-content/70 mt-1">
                  Designer project file
                </span>
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        ) : (
          <div className="flex items-center justify-between text-sm text-base-content/70 mb-4">
            <span>
              Selected file: {selectedFile.name} (
              {(selectedFile.size / 1024).toFixed(2)} KB)
            </span>
            <button
              onClick={() => {
                setSelectedFile(null);
                setDecodedContent(null);
                setError(null);
              }}
              className="btn btn-ghost btn-sm"
            >
              Remove
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 mb-4 text-sm text-error bg-error/10 rounded-lg">
            {error}
          </div>
        )}

        {decodedContent && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold text-base-content mb-2">
              Decoded Content:
            </h2>
            <div className="bg-base-300 rounded-lg overflow-hidden">
              <SyntaxHighlighter
                language="json"
                style={themeStorage === 'dark' ? monokai : githubGist}
                customStyle={{
                  background: 'transparent',
                  padding: '1rem',
                  margin: 0,
                  fontSize: '0.875rem',
                }}
              >
                {JSON.stringify(decodedContent, null, 2)}
              </SyntaxHighlighter>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
