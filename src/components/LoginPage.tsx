import React from 'react';
import { FaGoogle } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

const LoginPage: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Money Manager</h1>
          <p className="mt-2 text-sm text-gray-600">
            Track your expenses and manage your finances
          </p>
        </div>
        
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-700 text-center">
                Sign in to your account
              </p>
            </div>
            
            <div>
              <button
                onClick={signInWithGoogle}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaGoogle className="mr-2 h-5 w-5" />
                Sign in with Google
              </button>
            </div>
            
            <div className="text-xs text-center text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </div>
          </div>
        </div>
        
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Money Manager. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 