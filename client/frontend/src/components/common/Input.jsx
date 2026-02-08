// src/components/common/Input.jsx
import React from 'react';

const Input = ({ 
  label, 
  error, 
  helperText,
  required = false,
  icon: Icon,
  className = '',
  ...props 
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        <input
          className={`
            block w-full rounded-lg border-gray-300 shadow-sm
            focus:border-blue-500 focus:ring-blue-500
            ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            disabled:bg-gray-100 disabled:cursor-not-allowed
          `}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;