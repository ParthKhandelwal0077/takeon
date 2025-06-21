'use client'

import Link from 'next/link'

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-6">
            Sorry, something went wrong with your authentication. Please try again.
          </p>
          <Link 
            href="/authentication"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Back to Authentication
          </Link>
        </div>
      </div>
    </div>
  )
}