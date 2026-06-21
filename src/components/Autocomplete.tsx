import React, { useState, useEffect, useRef } from 'react';

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  icon?: React.ReactNode;
  id?: string;
}

export function Autocomplete({
  value,
  onChange,
  suggestions,
  placeholder = '',
  icon,
  id
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input value
  const filteredSuggestions = React.useMemo(() => {
    const val = value.trim().toLowerCase();
    if (!val) {
      // If blank, show top 10 values as preview options
      return suggestions.slice(0, 50);
    }
    return suggestions.filter(item => 
      item.toLowerCase().includes(val)
    ).slice(0, 50);
  }, [value, suggestions]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setCurrentIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
      setCurrentIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      if (isOpen && currentIndex >= 0 && currentIndex < filteredSuggestions.length) {
        e.preventDefault();
        const selectedValue = filteredSuggestions[currentIndex];
        onChange(selectedValue);
        setIsOpen(false);
        setCurrentIndex(-1);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setCurrentIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative w-full group">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-agt-orange transition-colors">
          {icon}
        </div>
      )}
      <input
        type="text"
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
          setCurrentIndex(-1);
        }}
        onFocus={() => {
          setIsOpen(true);
          setCurrentIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        className="block w-full pl-14 pr-12 py-5 bg-[#1d1d1d] border-2 border-[#FF0500] rounded-full text-lg font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#FF0500] focus:border-[#FF0500] transition-all input-glow text-[#FFB451] shadow-[0_0_30px_rgba(255,180,81,0.05)]"
      />
      
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-[#1a1a1a] border-2 border-[#FF0500] rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] custom-scrollbar">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setCurrentIndex(index)}
              className={`w-full text-left px-6 py-3 font-mono text-sm transition-colors block ${
                index === currentIndex 
                  ? 'bg-[#E25530]/20 text-[#FFB451]' 
                  : 'text-[#FFB451] hover:bg-[#1f1f1f]'
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
