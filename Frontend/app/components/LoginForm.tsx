import { login } from '../../utils/supabase/actions'

export default function LoginForm() {
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Log In</h2>
      <form className="space-y-4" aria-label="Login form">
        <div>
          <label 
            htmlFor="login-email" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input 
            id="login-email" 
            name="email" 
            type="email" 
            required 
            autoComplete="email" 
            aria-describedby="email-error"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter your email"
          />
          <div id="email-error" className="sr-only" aria-live="polite"></div>
        </div>
        
        <div>
          <label 
            htmlFor="login-password" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input 
            id="login-password" 
            name="password" 
            type="password" 
            required 
            autoComplete="current-password" 
            aria-describedby="password-error"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter your password"
          />
          <div id="password-error" className="sr-only" aria-live="polite"></div>
        </div>

        {/* Error/Success message placeholder */}
        {/* <div className="text-red-600 text-sm" role="alert" aria-live="polite">Error message here</div> */}
        
        <button 
          type="submit" 
          formAction={login} 
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-describedby="login-status"
        >
          Log in
        </button>
        <div id="login-status" className="sr-only" aria-live="polite"></div>
      </form>
      
      <p className="mt-4 text-sm text-gray-600 text-center">
        Enter your email and password to log in.
      </p>
    </div>
  )
} 