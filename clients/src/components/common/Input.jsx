// src/components/common/Input.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  ExclamationCircleIcon, 
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const Input = ({ 
  label, 
  error, 
  helperText,
  required = false,
  icon: Icon,
  className = '',
  type = 'text',
  showPasswordToggle = false,
  showCharacterCount = false,
  maxLength,
  success,
  id,
  autoFocus = false,
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  
  const inputId = id || `input-${label?.replace(/\s+/g, '-').toLowerCase() || Math.random().toString(36).substr(2, 9)}`;

  // Handle auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  const getInputType = () => {
    if (type === 'password' && showPasswordToggle && showPassword) {
      return 'text';
    }
    return type;
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (props.onFocus) props.onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (props.onBlur) props.onBlur(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getCharacterCountColor = () => {
    if (!maxLength || !props.value) return 'text-gray-500';
    const length = String(props.value).length;
    if (length > maxLength) return 'text-red-500';
    if (length > maxLength * 0.9) return 'text-yellow-500';
    return 'text-green-500';
  };

  const hasValue = props.value && String(props.value).trim().length > 0;

  return (
    <div className={`mb-5 ${className}`}>
      {/* Label with optional required indicator */}
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {/* Character counter */}
          {showCharacterCount && maxLength && props.value && (
            <span className={`text-xs font-medium ${getCharacterCountColor()}`}>
              {String(props.value).length}/{maxLength}
            </span>
          )}
        </div>
      )}
      
      {/* Input container with multiple states */}
      <div className="relative">
        {/* Icon on the left */}
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className={`h-5 w-5 transition-colors duration-200 ${
              error ? 'text-red-400' : 
              success ? 'text-green-400' : 
              isFocused ? 'text-blue-400' : 'text-gray-400'
            }`} />
          </div>
        )}
        
        {/* Main input */}
        <input
          id={inputId}
          ref={inputRef}
          type={getInputType()}
          className={`
            block w-full rounded-lg border transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-opacity-20
            ${Icon ? 'pl-10' : 'pl-4'} 
            pr-10 py-3
            ${error ? `
              border-red-300 bg-red-50 
              focus:border-red-400 focus:ring-red-100
              text-red-900 placeholder-red-300
            ` : success ? `
              border-green-300 bg-green-50 
              focus:border-green-400 focus:ring-green-100
              text-green-900 placeholder-green-300
            ` : `
              border-gray-300 bg-white
              focus:border-blue-400 focus:ring-blue-100
              text-gray-900 placeholder-gray-400
              hover:border-gray-400
            `}
            ${props.disabled ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}
            ${hasValue ? 'border-opacity-80' : 'border-opacity-60'}
          `}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : 
            helperText ? `${inputId}-helper` : 
            undefined
          }
          {...props}
        />
        
        {/* Right side icons (password toggle, status icons) */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-2">
          {/* Password toggle */}
          {type === 'password' && showPasswordToggle && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          )}
          
          {/* Success icon */}
          {success && !error && (
            <div className="text-green-500" aria-label="Valid input">
              <CheckCircleIcon className="h-5 w-5" />
            </div>
          )}
          
          {/* Error icon */}
          {error && (
            <div className="text-red-500" aria-label="Invalid input">
              <ExclamationCircleIcon className="h-5 w-5" />
            </div>
          )}
        </div>
        
        {/* Floating label effect (optional) */}
        {hasValue && isFocused && (
          <div className="absolute -top-2 left-3 px-1 bg-white text-xs text-blue-500 font-medium transition-all duration-200">
            {label}
          </div>
        )}
      </div>
      
      {/* Helper text and error messages */}
      <div className="mt-2 min-h-[20px]">
        {/* Error message */}
        {error && (
          <p 
            id={`${inputId}-error`}
            className="flex items-center text-sm text-red-600"
          >
            <ExclamationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
            {error}
          </p>
        )}
        
        {/* Success message */}
        {success && !error && (
          <p 
            id={`${inputId}-success`}
            className="flex items-center text-sm text-green-600"
          >
            <CheckCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
            {success}
          </p>
        )}
        
        {/* Helper text */}
        {helperText && !error && !success && (
          <p 
            id={`${inputId}-helper`}
            className="flex items-start text-sm text-gray-500"
          >
            <InformationCircleIcon className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
            {helperText}
          </p>
        )}
        
        {/* Character limit warning */}
        {maxLength && props.value && String(props.value).length > maxLength && (
          <p className="text-xs text-red-500 mt-1">
            {String(props.value).length - maxLength} character(s) over limit
          </p>
        )}
      </div>
    </div>
  );
};

export default Input;