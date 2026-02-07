"use client"

import { useEffect, useRef, useState } from "react"

import {
  searchPartiesAction,
  type PartyLookupDto,
} from "@/modules/parties/actions/searchParties.action"

interface PartyAutocompleteProps {
  label: string
  placeholder?: string
  selectedId: string
  selectedName: string
  onSelect: (id: string, name: string) => void
  onClear: () => void
  /**
   * Optional: external term control for URL sync.
   * If provided, component becomes "controlled" for the input value.
   */
  value?: string
  onChange?: (value: string) => void
}

export function PartyAutocomplete({
  label,
  placeholder = "Escribe al menos 2 letras…",
  selectedId,
  selectedName,
  onSelect,
  onClear,
  value: externalValue,
  onChange: externalOnChange,
}: PartyAutocompleteProps) {
  const isControlled = externalValue !== undefined

  const [internalTerm, setInternalTerm] = useState("")
  const [results, setResults] = useState<PartyLookupDto[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<number | null>(null)

  const term = isControlled ? externalValue : internalTerm
  const setTerm = isControlled ? externalOnChange! : setInternalTerm

  // ----- Autocomplete search (debounced) -----
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)

    debounceRef.current = window.setTimeout(async () => {
      const q = term.trim()
      if (q.length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const rows = await searchPartiesAction({ term: q, take: 10 })
        setResults(rows)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [term])

  function handleInputChange(next: string) {
    setTerm(next)

    // Editing invalidates any previous selection
    if (selectedId) {
      onClear()
    }
  }

  function handleSelect(party: PartyLookupDto) {
    onSelect(party.id, party.name)
    setTerm(party.name)
    setOpen(false)
  }

  function handleClearSelection() {
    onClear()
    setTerm("")
    setResults([])
  }

  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-medium">{label}</span>
      </label>

      <div className="relative">
        <input
          className="input input-bordered w-full"
          placeholder={placeholder}
          value={term}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          aria-label={label}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70">
          {loading ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <span>⌄</span>
          )}
        </div>

        {open && results.length > 0 ? (
          <div className="absolute z-50 mt-2 w-full rounded-box border border-base-300 bg-base-100 shadow">
            <ul className="menu menu-sm w-full">
              {results.map((p) => (
                <li key={p.id} className="w-full">
                  <button
                    type="button"
                    className="w-full justify-start text-left"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(p)}
                  >
                    <div className="flex flex-col items-start min-w-0">
                      <span className="font-medium truncate">{p.name}</span>
                      {p.phone ? (
                        <span className="text-xs opacity-70 truncate">
                          {p.phone}
                        </span>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {selectedId ? (
        <div className="mt-3 flex items-center gap-2">
          <span className="badge badge-success">Seleccionado</span>
          <span className="text-sm opacity-70">{selectedName}</span>

          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={handleClearSelection}
          >
            Quitar
          </button>
        </div>
      ) : null}
    </div>
  )
}
