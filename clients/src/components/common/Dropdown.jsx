// src/components/common/Dropdown.jsx
import React, { useState, useRef, useEffect } from 'react';

const Dropdown = ({
  trigger,
  items = [],
  align = 'left',
  className = '',
  onOpen,
  onClose
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const toggleDropdown = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  const handleItemClick = (item) => {
    if (item.onClick) {
      item.onClick();
    }
    setIsOpen(false);
    onClose?.();
  };

  const alignmentClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 transform -translate-x-1/2'
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger */}
      <div onClick={toggleDropdown} className="cursor-pointer">
        {trigger}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none ${alignmentClasses[align]}`}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1" role="none">
            {items.map((item, index) => {
              // Check if item is a divider
              if (item.divider) {
                return (
                  <div key={`divider-${index}`} className="border-t border-gray-100 my-1" />
                );
              }

              // Check if item is a header
              if (item.header) {
                return (
                  <div
                    key={`header-${index}`}
                    className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {item.header}
                  </div>
                );
              }

              // Regular menu item
              return (
                <button
                  key={item.key || index}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={`
                    w-full text-left px-4 py-2 text-sm
                    ${item.className || 'text-gray-700 hover:bg-gray-100'}
                    ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-900'}
                    flex items-center
                  `}
                  role="menuitem"
                  tabIndex={-1}
                >
                  {item.icon && (
                    <span className="mr-2 h-4 w-4">{item.icon}</span>
                  )}
                  {item.label}
                  {item.hotkey && (
                    <span className="ml-auto text-xs text-gray-400">{item.hotkey}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Dropdown.Item component for composition
Dropdown.Item = ({ children, onClick, className = '', icon, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      w-full text-left px-4 py-2 text-sm
      ${className || 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      flex items-center
    `}
  >
    {icon && <span className="mr-2 h-4 w-4">{icon}</span>}
    {children}
  </button>
);

// Dropdown.Header component
Dropdown.Header = ({ children }) => (
  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
    {children}
  </div>
);

// Dropdown.Divider component
Dropdown.Divider = () => (
  <div className="border-t border-gray-100 my-1" />
);

export default Dropdown;