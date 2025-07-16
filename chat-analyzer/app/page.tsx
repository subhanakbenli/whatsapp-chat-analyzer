'use client';

import { FileUpload } from "@/components/upload/FileUpload";
import { HowItWorks } from "@/components/ui/HowItWorks";
import { Features } from "@/components/ui/Features";
import { Privacy } from "@/components/ui/Privacy";
import LanguageSelector from "@/components/ui/LanguageSelector";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function Home() {
  const { locale } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">WA</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {locale.title}
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                {locale.features}
              </a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                {locale.howItWorks}
              </a>
              <a href="#privacy" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                {locale.privacy}
              </a>
            </nav>
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            {locale.title}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            {locale.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>100% Private & Secure</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>AI-Powered Analysis</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Instant Results</span>
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="max-w-2xl mx-auto mb-16">
          <FileUpload />
        </div>

        {/* Features Section */}
        <Features />

        {/* How It Works Section */}
        <HowItWorks />

        {/* Privacy Section */}
        <Privacy />
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">WA</span>
              </div>            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {locale.title}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {locale.subtitle}
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <a href="#privacy" className="hover:text-gray-900 dark:hover:text-white">
              {locale.privacy}
            </a>
            <a href="#terms" className="hover:text-gray-900 dark:hover:text-white">
              Terms of Service
            </a>
            <a href="#support" className="hover:text-gray-900 dark:hover:text-white">
              Support
            </a>
          </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
