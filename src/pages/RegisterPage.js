import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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
    
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validate()) {
      try {
        // Here you would integrate with Supabase Auth
        // const { user, error } = await supabase.auth.signUp({
        //   email: formData.email,
        //   password: formData.password,
        //   options: {
        //     data: {
        //       username: formData.username
        //     }
        //   }
        // });
        
        // if (error) throw error;
        
        // For now, just show success and redirect
        alert('Registration successful! Please check your email to confirm your account.');
        navigate('/login');
      } catch (error) {
        alert('Registration failed: ' + error.message);
      }
    }
  };
  
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Create an Account</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="mb-4">
            <label htmlFor="username" className="block mb-2 font-medium text-gray-700">Username*</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Choose a username"
            />
            {errors.username && <p className="mt-1 text-red-500 text-sm">{errors.username}</p>}
          </div>
          
          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2 font-medium text-gray-700">Email*</label>
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
          <div className="mb-4">
            <label htmlFor="password" className="block mb-2 font-medium text-gray-700">Password*</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Create a password"
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
            <p className="mt-1 text-gray-500 text-sm">Password must be at least 8 characters</p>
          </div>
          
          {/* Confirm Password */}
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block mb-2 font-medium text-gray-700">Confirm Password*</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Confirm your password"
              />
              <button 
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} className="text-gray-500" /> : <Eye size={20} className="text-gray-500" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-red-500 text-sm">{errors.confirmPassword}</p>}
          </div>
          
          {/* Terms Agreement */}
          <div className="mb-6">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="agreeTerms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="mt-1 w-4 h-4"
              />
              <label htmlFor="agreeTerms" className="ml-2 text-gray-700">
                I agree to the <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
              </label>
            </div>
            {errors.agreeTerms && <p className="mt-1 text-red-500 text-sm">{errors.agreeTerms}</p>}
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md"
          >
            Create Account
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;