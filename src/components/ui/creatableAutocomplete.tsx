'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface AutocompleteValue {
  id?: string;
  label: string;
}

export interface CreatableAutocompleteProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  value: AutocompleteValue | null;
  onSelect: (value: AutocompleteValue) => void;
  searchEndpoint: string;
  deleteEndpoint: string;
  placeholder?: string;
  emptyLabel?: string;
}

export const CreatableAutocomplete = forwardRef<
  HTMLDivElement,
  CreatableAutocompleteProps
>(function CreatableAutocomplete(
  {
    value,
    onSelect,
    searchEndpoint,
    deleteEndpoint,
    placeholder = '',
    emptyLabel = 'Add new',
    className,
    ...props
  },
  ref
) {
  const [query, setQuery] = useState(value?.label ?? '');
  const [options, setOptions] = useState<AutocompleteValue[]>([]);
  const [createdOptions, setCreatedOptions] = useState<AutocompleteValue[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingNew, setIsEditingNew] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  const wrapperRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => wrapperRef.current as HTMLDivElement); 
  
  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
        setIsEditingNew(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch matching options
  useEffect(() => {
    if (!query) {
      setOptions([]);
      return;
    }

    let cancelled = false;

    fetch(`${searchEndpoint}?query=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;

        setOptions(
          data.map((item: any) => ({
            id: (item.slocId ?? item.ihId)?.toString(),
            label: item.slocName ?? item.ihName,
          }))
        );
      });

    return () => {
      cancelled = true;
    };
  }, [query, searchEndpoint]);

  const allOptions = useMemo(
    () =>
      [...createdOptions, ...options].filter(
        o => !o.id || !deletedIds.has(o.id)
      ),
    [createdOptions, options, deletedIds]
  );

  const optionExists = allOptions.some(o => o.label === query);

  const handleSelect = (option: AutocompleteValue) => {
    onSelect(option);
    setQuery(option.label);
    setIsOpen(false);
    setIsEditingNew(false);
  };

  const handleStartCreate = () => {
    setIsEditingNew(true);
    setNewLabel(query);
  };

  const handleConfirmCreate = () => {
    const label = newLabel.trim();
    if (!label) return;

    const newOption: AutocompleteValue = { label };
    setCreatedOptions(prev => [...prev, newOption]);
    handleSelect(newOption);
    setNewLabel('');
  };

  const handleDelete = async (option: AutocompleteValue) => {
    // Do not delete option currently selected
    if (value?.label === option.label) {
      alert('Cannot delete this item because it is currently in use.');
      return;
    }

    const id = option.id;

    if (id) {
      setDeletedIds(prev => new Set(prev).add(id));
    } else {
      setCreatedOptions(prev => prev.filter(o => o.label !== option.label));
      return;
    }

    try {
      const res = await fetch(`${deleteEndpoint}?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    } catch (err) {
      console.error(err);
      setDeletedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={cn('relative w-full', className)}
      {...props}
    >
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onFocus={() => setIsOpen(true)}
        onChange={e => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {isOpen && (
        <ul className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-white shadow-md">
          {allOptions.map(option => (
            <li
              key={option.id ?? option.label}
              className="flex items-center justify-between px-3 py-2 text-sm hover:bg-blue-100"
            >
              <span
                className="flex-1 cursor-pointer"
                onClick={() => handleSelect(option)}
              >
                {option.label}
              </span>

              <button
                className="ml-2 text-xs text-red-500 hover:underline"
                onClick={e => {
                  e.stopPropagation();
                  handleDelete(option);
                }}
              >
                Delete
              </button>
            </li>
          ))}

          {query && !optionExists && !isEditingNew && (
            <li
              className="cursor-pointer px-3 py-2 text-sm font-medium hover:bg-green-100"
              onClick={handleStartCreate}
            >
              ➕ {emptyLabel} "{query}"
            </li>
          )}

          {isEditingNew && (
            <li className="flex items-center gap-2 bg-green-50 px-3 py-2">
              <input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="Type new..."
                className="flex-1 rounded-md border px-2 py-1 text-sm"
              />
              <button
                onClick={handleConfirmCreate}
                className="rounded-md bg-blue-500 px-3 py-1 text-sm text-white"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsEditingNew(false);
                  setNewLabel('');
                }}
                className="rounded-md bg-gray-300 px-3 py-1 text-sm"
              >
                Cancel
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
});

CreatableAutocomplete.displayName = 'CreatableAutocomplete';