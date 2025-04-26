import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const LoginPage = ({ setIsLoggedIn, setCurrentUser }) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validate()) {
      setIsLoading(true);
      
      try {
        // Here you would integrate with Supabase Auth
        // const { user, error } = await supabase.auth.signInWithPassword({
        //   email: formData.email,
        //   password: formData.password
        // });
        
        // if (error) throw error;
        
        // Mock successful login for now
        setTimeout(() => {
          // Set login state
          setIsLoggedIn(true);
          
          // Set mock user data
          setCurrentUser({
            id: '1',
            username: 'demouser',
            email: formData.email
          });
          
          setIsLoading(false);
          navigate('/');
        }, 1000);
      } catch (error) {
        setIsLoading(false);
        alert('Login failed: ' + error.message);
      }
    }
  };
  
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Log In</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2 font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="your@email.com"
            />
            {errors.email && <p className="mt-1 text-red-500 text-sm">{errors.email}</p>}
          </div>
          
          {/* Password */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <label htmlFor="password" className="font-medium text-gray-700">Password</label>
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot Password?</Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter your password"
              />
              <button 
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} className="text-gray-500" /> : <Eye size={20} className="text-gray-500" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-red-500 text-sm">{errors.password}</p>}
          </div>
          
          {/* Remember Me */}
          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="w-4 h-4"
            />
            <label htmlFor="rememberMe" className="ml-2 text-gray-700">
              Remember me
            </label>
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </>
            ) : 'Log In'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Sign up</Link>
          </p>
        </div>
        
        {/* Optional: Social Login Options */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Google
            </button>
            <button
              type="button"
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;