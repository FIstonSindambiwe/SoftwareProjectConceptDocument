// src/components/common/ActionModal.jsx
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const ActionModal = ({ isOpen, onClose, position, items }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed z-50 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 animate-slideDown"
        style={{
          top: position.y,
          left: position.x,
          transform: 'translateX(-100%)'
        }}
      >
        <div className="py-1" role="menu">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                }
              }}
              disabled={item.disabled}
              className={`
                w-full text-left px-4 py-2.5 text-sm 
                flex items-center
                ${item.disabled 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-50'
                }
                ${item.className || ''}
                transition-colors
              `}
              role="menuitem"
            >
              {item.icon}
              {item.label}
              {item.disabled && (
                <span className="ml-auto text-xs text-gray-400">Disabled</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body
  );
};

export default ActionModal;