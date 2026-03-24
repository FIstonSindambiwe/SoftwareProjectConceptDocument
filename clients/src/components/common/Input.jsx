// src/components/common/Input.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  ExclamationCircleIcon, 
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon,
  XMarkIcon
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
  clearable = false,
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const inputRef = useRef(null);
  
  const inputId = id || `input-${label?.replace(/\s+/g, '-').toLowerCase() || Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  useEffect(() => {
    setHasValue(props.value && String(props.value).trim().length > 0);
  }, [props.value]);

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

  const handleClear = () => {
    if (props.onChange) {
      props.onChange({ target: { name: props.name, value: '' } });
    }
    inputRef.current?.focus();
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

  // Determine input border and background styles
  const getInputStyles = () => {
    if (error) {
      return 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100 text-red-900 placeholder-red-300';
    }
    if (success) {
      return 'border-green-300 bg-green-50 focus:border-green-400 focus:ring-green-100 text-green-900 placeholder-green-300';
    }
    if (props.disabled) {
      return 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed';
    }
    return 'border-gray-200 bg-white focus:border-blue-400 focus:ring-blue-100 text-gray-900 placeholder-gray-400 hover:border-gray-300';
  };

  return (
    <div className={`${className}`}>
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          
          {/* Character counter */}
          {showCharacterCount && maxLength && props.value && (
            <span className={`text-xs font-medium ${getCharacterCountColor()}`}>
              {String(props.value).length}/{maxLength}
            </span>
          )}
        </div>
      )}
      
      {/* Input container */}
      <div className="relative">
        {/* Left Icon */}
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className={`h-5 w-5 transition-colors duration-200 ${
              error ? 'text-red-400' : 
              success ? 'text-green-400' : 
              isFocused ? 'text-blue-500' : 'text-gray-400'
            }`} />
          </div>
        )}
        
        {/* Main Input */}
        <input
          id={inputId}
          ref={inputRef}
          type={getInputType()}
          className={`
            block w-full rounded-lg border transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-opacity-20
            ${Icon ? 'pl-10' : 'pl-4'} 
            ${(clearable && hasValue && !props.disabled) || (type === 'password' && showPasswordToggle) ? 'pr-10' : 'pr-4'}
            py-2.5 text-sm
            ${getInputStyles()}
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
        
        {/* Right side actions */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1">
          {/* Clear button */}
          {clearable && hasValue && !props.disabled && type !== 'password' && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Clear input"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
          
          {/* Password toggle */}
          {type === 'password' && showPasswordToggle && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="p-0.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
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
            <CheckCircleIcon className="h-5 w-5 text-green-500" aria-label="Valid input" />
          )}
          
          {/* Error icon */}
          {error && (
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-label="Invalid input" />
          )}
        </div>
        
        {/* Floating label effect */}
        {hasValue && isFocused && label && (
          <div className="absolute -top-2.5 left-3 px-1.5 bg-white text-xs text-blue-600 font-medium rounded-full shadow-sm border border-gray-100">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </div>
        )}
      </div>
      
      {/* Helper text and error messages */}
      <div className="mt-1.5 min-h-[20px]">
        {error && (
          <p 
            id={`${inputId}-error`}
            className="flex items-center gap-1 text-xs text-red-600"
          >
            <ExclamationCircleIcon className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}
        
        {success && !error && (
          <p 
            id={`${inputId}-success`}
            className="flex items-center gap-1 text-xs text-green-600"
          >
            <CheckCircleIcon className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{success}</span>
          </p>
        )}
        
        {helperText && !error && !success && (
          <p 
            id={`${inputId}-helper`}
            className="flex items-start gap-1 text-xs text-gray-500"
          >
            <InformationCircleIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>{helperText}</span>
          </p>
        )}
        
        {/* Character limit warning */}
        {maxLength && props.value && String(props.value).length > maxLength && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <ExclamationCircleIcon className="h-3.5 w-3.5" />
            {String(props.value).length - maxLength} character(s) over limit
          </p>
        )}
      </div>
    </div>
  );
};

export default Input;