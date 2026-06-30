import { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { useEffect } from 'react';

interface SearchInputProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  className?: string;
  defaultValue?: string;
}

export function SearchInput({
  placeholder = 'Search...',
  onSearch,
  className,
  defaultValue = '',
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);
  const debouncedValue = useDebounce(value, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  const handleClear = () => {
    setValue('');
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-8"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
