import { signup } from '../../utils/supabase/actions'

export default function SignupForm() {
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Sign Up</h2>
      <form className="space-y-4" aria-label="Signup form">
        <div>
          <label 
            htmlFor="signup-email" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input 
            id="signup-email" 
            name="email" 
            type="email" 
            required 
            autoComplete="email" 
            aria-describedby="signup-email-error"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter your email"
          />
          <div id="signup-email-error" className="sr-only" aria-live="polite"></div>
        </div>
        
        <div>
          <label 
            htmlFor="signup-username" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Username
          </label>
          <input
            id="signup-username"
            name="username"
            type="text"
            required
            autoComplete="username"
            aria-describedby="signup-username-error"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Choose a username"
          />
          <div id="signup-username-error" className="sr-only" aria-live="polite"></div>
        </div>

        <div>
          <label 
            htmlFor="signup-password" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input 
            id="signup-password" 
            name="password" 
            type="password" 
            required 
            autoComplete="new-password" 
            aria-describedby="signup-password-error"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Create a password"
            minLength={8}
          />
          <div id="signup-password-error" className="sr-only" aria-live="polite"></div>
        </div>

        {/* Error/Success message placeholder */}
        {/* <div className="text-red-600 text-sm" role="alert" aria-live="polite">Error message here</div> */}
        
        <button 
          type="submit" 
          formAction={signup} 
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-describedby="signup-status"
        >
          Sign up
        </button>
        <div id="signup-status" className="sr-only" aria-live="polite"></div>
      </form>
      
      <p className="mt-4 text-sm text-gray-600 text-center">
        Create a new account with your email and password.
      </p>
    </div>
  )
} 