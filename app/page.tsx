'use client';

import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import Image from 'next/image';

interface WebApp {
  ready: () => void;
  expand: () => void;
  MainButton: {
    show: () => void;
    hide: () => void;
  };
  initData: string;
}

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp;
    };
  }
}

interface SummaryResult {
  summary: string;
  keyPoints: string[];
}

interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

// Reusable button component - optimized for Telegram
function Button({
  onClick,
  disabled = false,
  loading = false,
  loadingText,
  children,
  variant = 'primary',
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const baseClasses = 'w-full font-semibold py-4 rounded-lg transition disabled:opacity-50 active:scale-95 text-base min-h-[50px] flex items-center justify-center';
  const primaryClasses =
    'bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white shadow-md';
  const secondaryClasses =
    'bg-gray-300 hover:bg-gray-400 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200';

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${isPrimary ? primaryClasses : secondaryClasses}`}
    >
      {loading && loadingText ? loadingText : children}
    </button>
  );
}

// Maximum text length validation (must match backend)
const MAX_TEXT_LENGTH = 10000;

export default function Home() {
  // Suppress hydration warning for Telegram viewport variables
  useLayoutEffect(() => {
    // This runs before paint, ensuring client matches server
    const htmlElement = document.documentElement;
    // Remove the style attribute to prevent hydration mismatch
    if (htmlElement.style.cssText.includes('--tg-viewport')) {
      htmlElement.style.cssText = '';
    }
  }, []);

  const [inputMode, setInputMode] = useState<'select' | 'image' | 'text' | 'pdf' | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedPDF, setSelectedPDF] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [userText, setUserText] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'upload' | 'extracted' | 'summary'>('upload');
  const [sendingToTelegram, setSendingToTelegram] = useState(false);
  const [telegramSent, setTelegramSent] = useState(false);
  const [isTelegramContext, setIsTelegramContext] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Initialize Telegram Mini App
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      webApp.ready();
      webApp.expand();
      // Check if we have valid initData (indicates we're in Telegram context)
      if (webApp.initData) {
        setIsTelegramContext(true);
      }
    }
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handlePDFSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPDF(file);
      setError('');
    }
  };

  const handleExtractFromPDF = async () => {
    if (!selectedPDF) return;

    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('pdf', selectedPDF);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout (PDFs take longer)

      try {
        const response = await fetch('/api/pdf-extract', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to extract PDF text');
        }

        setExtractedText(data.text);
        setStep('extracted');
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
          throw new Error('PDF processing timed out. Please try with a smaller PDF.');
        }
        throw fetchErr;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExtractText = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch('/api/ocr', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to extract text');
        }

        setExtractedText(data.text);
        setStep('extracted');
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw fetchErr;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!extractedText) return;

    setLoading(true);
    setError('');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: extractedText }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to summarize');
        }

        setSummary(data);
        setStep('summary');
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
          throw new Error('Summarization timed out. Please try again.');
        }
        throw fetchErr;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToTelegram = async () => {
    if (!summary) return;

    setSendingToTelegram(true);
    setError('');

    try {
      const response = await fetch('/api/send-to-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: summary.summary,
          keyPoints: summary.keyPoints,
          initData: window.Telegram?.WebApp?.initData || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send to Telegram');
      }

      setTelegramSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSendingToTelegram(false);
    }
  };

  const handleReset = () => {
    setInputMode('select');
    setSelectedImage(null);
    setSelectedPDF(null);
    setPreview('');
    setUserText('');
    setExtractedText('');
    setSummary(null);
    setError('');
    setStep('upload');
    setSendingToTelegram(false);
    setTelegramSent(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-3 pb-8">
      <div className="max-w-lg mx-auto">
        {/* Back Button - Top Edge */}
        {(inputMode !== null || step !== 'upload') && (
          <button
            onClick={() => {
              if (inputMode === null && step !== 'upload') {
                handleReset();
              } else {
                setInputMode(null);
                setStep('upload');
                setError('');
              }
            }}
            className="mb-4 flex items-center gap-1 px-3 py-2 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium transition active:scale-95"
          >
            <span className="text-lg">←</span>
            <span className="text-sm">Back</span>
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6 pt-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            SummarizeIT AI
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 px-2">
            Extract text from images, PDFs, or summarize text directly
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Input Mode Selection */}
        {inputMode === null && step === 'upload' && (
          <div className="space-y-3">
            <p className="text-center text-gray-700 dark:text-gray-300 font-semibold mb-5 text-base">
              Choose how you want to summarize:
            </p>
            <Button
              onClick={() => setInputMode('image')}
              variant="primary"
            >
              <span className="text-3xl mr-3">📸</span>
              <span>Image Based</span>
            </Button>
            <Button
              onClick={() => setInputMode('pdf')}
              variant="primary"
            >
              <span className="text-3xl mr-3">📄</span>
              <span>PDF Based</span>
            </Button>
            <Button
              onClick={() => setInputMode('text')}
              variant="primary"
            >
              <span className="text-3xl mr-3">✏️</span>
              <span>Text Based</span>
            </Button>
          </div>
        )}

        {/* Step 1: Image Upload */}
        {inputMode === 'image' && step === 'upload' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-300 dark:border-indigo-600 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-700 transition active:scale-95"
            >
              <div className="text-5xl mb-3">📸</div>
              <p className="text-gray-700 dark:text-gray-300 font-semibold text-base">
                Upload an Image
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                PNG, JPG, or screenshot
              </p>
            </div>

            {preview && (
              <div className="space-y-4">
                <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-700">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <Button
                  onClick={handleExtractText}
                  loading={loading}
                  loadingText="Extracting Text..."
                >
                  Extract Text
                </Button>
                <Button
                  onClick={() => {
                    setPreview('');
                    setSelectedImage(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={loading}
                  variant="secondary"
                >
                  Choose Different Image
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {!preview && (
              <Button
                onClick={() => setInputMode(null)}
                variant="secondary"
              >
                Back
              </Button>
            )}
          </div>
        )}

        {/* Step 1: PDF Upload */}
        {inputMode === 'pdf' && step === 'upload' && (
          <div className="space-y-4">
            <div
              onClick={() => pdfInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-300 dark:border-indigo-600 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-700 transition active:scale-95"
            >
              <div className="text-5xl mb-3">📄</div>
              <p className="text-gray-700 dark:text-gray-300 font-semibold text-base">
                Upload a PDF
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                PDF documents only
              </p>
            </div>

            {selectedPDF && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-slate-700 rounded-lg p-4 border border-blue-200 dark:border-blue-600">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    📎 {selectedPDF.name}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {(selectedPDF.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  onClick={handleExtractFromPDF}
                  loading={loading}
                  loadingText="Extracting PDF..."
                >
                  Extract & Summarize
                </Button>
                <Button
                  onClick={() => {
                    setSelectedPDF(null);
                    if (pdfInputRef.current) {
                      pdfInputRef.current.value = '';
                    }
                  }}
                  disabled={loading}
                  variant="secondary"
                >
                  Choose Different PDF
                </Button>
              </div>
            )}

            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              onChange={handlePDFSelect}
              className="hidden"
            />

            {!selectedPDF && (
              <Button
                onClick={() => setInputMode(null)}
                variant="secondary"
              >
                Back
              </Button>
            )}
          </div>
        )}

        {/* Step 1: Text Input */}
        {inputMode === 'text' && step === 'upload' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Enter text to summarize
              </label>
              <textarea
                value={userText}
                onChange={(e) => {
                  setUserText(e.target.value);
                  setError('');
                }}
                placeholder="Paste or type the text you want to summarize..."
                className="w-full h-48 p-4 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base resize-none"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {userText.length} / {MAX_TEXT_LENGTH} characters
                </p>
                {userText.length > MAX_TEXT_LENGTH && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
                    Text exceeds maximum length
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={() => {
                setExtractedText(userText);
                setStep('extracted');
              }}
              disabled={!userText.trim() || userText.length > MAX_TEXT_LENGTH}
              variant="primary"
            >
              Proceed to Summary
            </Button>

            <Button
              onClick={() => setInputMode(null)}
              variant="secondary"
            >
              Back
            </Button>
          </div>
        )}

        {/* Step 2: Extracted Text */}
        {step === 'extracted' && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                {inputMode === 'image' ? '📸 Extracted Text' : inputMode === 'pdf' ? '📄 PDF Content' : '✏️ Text to Summarize'}
              </p>
              <p className="text-base text-gray-700 dark:text-gray-300 max-h-48 overflow-y-auto whitespace-pre-wrap break-words leading-relaxed">
                {extractedText}
              </p>
            </div>

            <Button
              onClick={handleSummarize}
              loading={loading}
              loadingText="Summarizing..."
              variant="primary"
            >
              Summarize with AI
            </Button>

            <Button
              onClick={handleReset}
              disabled={loading}
              variant="secondary"
            >
              Start Over
            </Button>
          </div>
        )}

        {/* Step 3: Summary */}
        {step === 'summary' && summary && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-green-400 dark:border-green-600">
              <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase mb-3">
                ✨ Summary
              </p>
              <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                {summary.summary}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-4">
                🎯 Key Points
              </p>
              <ul className="space-y-3">
                {summary.keyPoints.map((point, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">•</span>
                    <span className="pt-0.5">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Telegram Success Message */}
            {telegramSent && (
              <div className="p-3 bg-blue-100 dark:bg-blue-900 border border-blue-400 dark:border-blue-700 text-blue-800 dark:text-blue-200 rounded-lg text-sm">
                ✅ Summary sent to your Telegram chat!
              </div>
            )}

            {/* Send to Telegram Button */}
            {isTelegramContext && !telegramSent && (
              <Button
                onClick={handleSendToTelegram}
                loading={sendingToTelegram}
                loadingText="Sending to Telegram..."
                variant="primary"
              >
                📤 Send to Telegram Chat
              </Button>
            )}

            <Button
              onClick={handleReset}
              variant="primary"
            >
              {inputMode === 'image' ? '📸 Process Another Image' : inputMode === 'pdf' ? '📄 Process Another PDF' : '✏️ Summarize Another Text'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
