import { useRef, useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Input } from './Input';
import type { GeocodeResult } from '../../services/geocode.api';

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectAddress: (result: GeocodeResult) => void;
  suggestions: GeocodeResult[];
  loading?: boolean;
  error?: string | null;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  labelClassName?: string;
  className?: string;
}

export const AddressInput = ({
  value,
  onChange,
  onSelectAddress,
  suggestions,
  loading = false,
  error = null,
  placeholder = 'Nhập địa chỉ',
  disabled = false,
  label,
  labelClassName = '',
  className = ''
}: AddressInputProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsDropdownOpen(true);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        setIsDropdownOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectSuggestion = (result: GeocodeResult) => {
    onSelectAddress(result);
    onChange(result.formattedAddress);
    setIsDropdownOpen(false);
    setSelectedIndex(-1);
  };

  const showDropdown =
    isDropdownOpen && suggestions.length > 0 && value.trim().length > 0;

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0 && value.trim().length > 0) {
            setIsDropdownOpen(true);
          }
        }}
        placeholder={placeholder}
        disabled={disabled || loading}
        error={error || undefined}
        icon={
          loading ? (
            <Loader2 size={18} className="text-amber-500 animate-spin" />
          ) : (
            <MapPin size={18} className="text-zinc-600" />
          )
        }
        label={label}
        labelClassName={labelClassName}
        className={className}
      />

      {/* Dropdown List */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-zinc-800/95 border border-white/10 rounded-2xl shadow-2xl z-50 backdrop-blur-sm max-h-80 overflow-y-auto"
          style={{
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
          }}
        >
          {suggestions.map((result, index) => (
            <button
              key={result.placeId}
              type="button"
              onClick={() => handleSelectSuggestion(result)}
              className={`w-full px-4 py-3 text-left text-sm transition-colors border-b border-white/5 last:border-b-0 ${
                index === selectedIndex
                  ? 'bg-amber-500/20 text-amber-100'
                  : 'text-zinc-300 hover:bg-white/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 flex-shrink-0 text-amber-500/60" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-zinc-100 truncate">
                    {result.name}
                  </div>
                  <div className="text-xs text-zinc-400 truncate">
                    {result.address}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-500 font-bold uppercase tracking-wider mt-1 ml-1">
          {error}
        </p>
      )}
    </div>
  );
};
