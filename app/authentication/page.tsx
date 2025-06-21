'use client'

import { useState } from 'react'
import LoginForm from '../components/LoginForm'
import SignupForm from '../components/SignupForm'

export default function AuthenticationPage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Toggle buttons */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <div className="flex" role="tablist" aria-label="Authentication method">
            <button
              onClick={() => setIsLogin(true)}
              role="tab"
              aria-selected={isLogin}
              aria-controls="login-panel"
              id="login-tab"
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isLogin 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              role="tab"
              aria-selected={!isLogin}
              aria-controls="signup-panel"
              id="signup-tab"
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                !isLogin 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Form panels */}
        <div role="tabpanel" id="login-panel" aria-labelledby="login-tab" className={isLogin ? 'block' : 'hidden'}>
          <LoginForm />
        </div>
        <div role="tabpanel" id="signup-panel" aria-labelledby="signup-tab" className={!isLogin ? 'block' : 'hidden'}>
          <SignupForm />
        </div>
      </div>
    </div>
  )
}