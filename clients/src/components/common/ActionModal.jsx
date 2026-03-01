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
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-transparent"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed z-50 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 animate-slideDown"
        style={{
          top: Math.min(position.y, window.innerHeight - 200), // Prevent going off screen
          left: Math.min(position.x - 224, window.innerWidth - 240), // 224px = modal width + padding
        }}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="action-menu"
      >
        <div className="py-1" role="none">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  onClose();
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
                focus:outline-none focus:bg-gray-50
              `}
              role="menuitem"
              tabIndex={item.disabled ? -1 : 0}
            >
              <span className="flex items-center flex-1">
                {item.icon}
                {item.label}
              </span>
              {item.disabled && (
                <span className="ml-auto text-xs text-gray-400">
                  {item.disabledReason || 'Disabled'}
                </span>
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