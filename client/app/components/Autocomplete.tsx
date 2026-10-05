import { useId, useMemo, useRef, useState } from "react";

export type AutocompleteOption = {
  label: string;
  // Extra names the option can be found by (e.g. Māori or scientific name)
  aliases?: string[];
  // Secondary text shown under the label in the list
  hint?: string;
};

type AutocompleteProps = {
  options: AutocompleteOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxSuggestions?: number;
};

// Lowercase and strip diacritics so "maui" matches "Māui"
function normalise(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function Autocomplete({
  options,
  value,
  onChange,
  placeholder,
  maxSuggestions = 8,
}: AutocompleteProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const suggestions = useMemo(() => {
    const q = normalise(value);
    if (!q) return [];
    const exact: AutocompleteOption[] = [];
    const starts: AutocompleteOption[] = [];
    const contains: AutocompleteOption[] = [];

    for (const opt of options) {
      const names = [opt.label, ...(opt.aliases ?? [])].map(normalise);
      if (names.some((n) => n === q)) exact.push(opt);
      else if (names.some((n) => n.startsWith(q) || n.includes(` ${q}`))) starts.push(opt);
      else if (names.some((n) => n.includes(q))) contains.push(opt);
    }
    return [...exact, ...starts, ...contains].slice(0, maxSuggestions);
  }, [options, value, maxSuggestions]);

  // Nothing left to pick if the only suggestion is what's already typed
  const alreadySelected = suggestions.length === 1 && suggestions[0].label === value;
  const isOpen = open && suggestions.length > 0 && !alreadySelected;

  function accept(opt: AutocompleteOption) {
    onChange(opt.label);
    setOpen(false);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (e.key === "ArrowDown" && suggestions.length > 0) {
        e.preventDefault();
        setActive(0);
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => (i + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
        break;
      case "Enter":
      case "Tab": {
        const selected = suggestions[active];
        if (selected !== undefined) {
          e.preventDefault();
          accept(selected);
        }
        break;
      }
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  }

  return (
    <div className="autocomplete">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={isOpen ? `${listId}-${active}` : undefined}
        value={value}
        required={true}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
      />
      {isOpen && (
        <ul id={listId} role="listbox" className="autocomplete-list">
          {suggestions.map((opt, i) => (
            <li
              key={opt.label}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? "autocomplete-option active" : "autocomplete-option"}
              // onMouseDown fires before the input's onBlur closes the list
              onMouseDown={(e) => {
                e.preventDefault();
                accept(opt);
              }}
              onMouseEnter={() => setActive(i)}
            >
              <span>{opt.label}</span>
              {opt.hint && <small>{opt.hint}</small>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
