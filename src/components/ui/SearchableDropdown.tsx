import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, Folder } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  group?: string;
  isChild?: boolean;
}

interface SearchableDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  creatable?: boolean;
  onSearchChange?: (val: string) => void;
  id?: string;
  onEnterSelectFocusId?: string;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  creatable = false,
  onSearchChange,
  id,
  onEnterSelectFocusId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => options.find(o => o.value === value), [options, value]);

  const filteredOptions = useMemo(() => {
    let result = options;
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      result = options.filter(o => o.label.toLowerCase().includes(lowerSearch) || o.group?.toLowerCase().includes(lowerSearch));
    }
    
    if (creatable && search.trim() && !options.some(o => o.label.toLowerCase() === search.toLowerCase())) {
      result = [...result, { value: `CREATE_CUSTOM::${search.trim()}`, label: `Use "${search.trim()}"`, group: 'Custom' }];
    }
    return result;
  }, [options, search, creatable]);

  // When clicking outside, close the dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [openUpwards, setOpenUpwards] = useState(false);

  // When options or value changes, reset highlighted index
  useEffect(() => {
    if (isOpen) {
      const currentIdx = filteredOptions.findIndex(o => o.value === value);
      setHighlightedIndex(currentIdx >= 0 ? currentIdx : 0);

      // Check if we need to open upwards
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpwards(spaceBelow < 260); // 240px is max-h-60
      }
    }
  }, [isOpen, value, filteredOptions.length]);

  const handleSelect = (val: string, wasEnter = false) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
    if (wasEnter && onEnterSelectFocusId) {
      setTimeout(() => {
        document.getElementById(onEnterSelectFocusId)?.focus();
      }, 0);
    } else if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      else {
        setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        scrollToHighlighted(highlightedIndex + 1);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      else {
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
        scrollToHighlighted(highlightedIndex - 1);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex].value, true);
      } else {
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearch('');
    } else if (e.key === 'Tab') {
      if (isOpen && search && filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex].value);
      } else {
        setIsOpen(false);
      }
    }
  };

  const scrollToHighlighted = (index: number) => {
    if (listRef.current) {
      const button = listRef.current.children[index] as HTMLElement;
      if (button) {
        button.scrollIntoView({ block: 'nearest' });
      }
    }
  };

  const displayValue = isOpen ? search : (selectedOption ? selectedOption.label : '');
  const displayPlaceholder = isOpen && selectedOption ? selectedOption.label : placeholder;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative flex items-center">
        {selectedOption?.icon && !isOpen && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {selectedOption.icon}
          </div>
        )}
        <input
          id={id}
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={displayValue}
          placeholder={displayPlaceholder}
          onChange={(e) => {
            setSearch(e.target.value);
            setHighlightedIndex(0);
            if (!isOpen) setIsOpen(true);
            if (onSearchChange) onSearchChange(e.target.value);
          }}
          onFocus={() => {
            if (!disabled) {
              setSearch('');
              setIsOpen(true);
            }
          }}
          onClick={() => {
            if (!disabled && !isOpen) {
              setSearch('');
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className={`w-full bg-surface-muted border rounded-xl py-2.5 text-xs text-text transition focus:outline-hidden ${
            selectedOption?.icon && !isOpen ? 'pl-9 pr-8' : 'px-3.5'
          } ${
            isOpen ? 'border-primary bg-white ring-2 ring-primary/20' : 'border-border focus:border-primary focus:bg-white'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown className={`w-4 h-4 text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className={`absolute z-50 w-full bg-white border border-border rounded-xl shadow-lg flex flex-col overflow-hidden max-h-60 ${
          openUpwards ? 'bottom-full mb-1' : 'top-full mt-1'
        }`}>
          <div className="overflow-y-auto overflow-x-hidden p-1 custom-scrollbar" ref={listRef}>
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-secondary">
                No matches found
              </div>
            ) : (
              filteredOptions.map((opt, idx) => (
                <button
                  key={opt.value}
                  type="button"
                  onMouseDown={(e) => {
                    // prevent input from losing focus when clicking an option
                    e.preventDefault();
                    handleSelect(opt.value);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition cursor-pointer mb-0.5 ${
                    highlightedIndex === idx
                      ? 'bg-primary/10 text-primary-dark font-bold'
                      : 'hover:bg-surface-muted text-text hover:text-primary-dark'
                  } ${opt.isChild ? 'pl-7' : ''}`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {opt.icon}
                    <span className="truncate" title={opt.label}>{opt.label}</span>
                  </span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
