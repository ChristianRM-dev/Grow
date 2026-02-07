"use client"

import { useEffect, useRef, useState } from "react"

import {
  loadPartiesForFilterAction,
  type PartyFilterDto,
} from "@/modules/parties/actions/loadPartiesForFilter.action"

type SelectionMode = "include" | "exclude"

interface PartyMultiSelectorProps {
  isOpen: boolean
  onClose: () => void
  selectedIds: string[]
  mode: SelectionMode
  onConfirm: (selectedIds: string[], mode: SelectionMode) => void
  title?: string
}

export function PartyMultiSelector({
  isOpen,
  onClose,
  selectedIds: initialSelectedIds,
  mode: initialMode,
  onConfirm,
  title = "Seleccionar clientes/proveedores",
}: PartyMultiSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [parties, setParties] = useState<PartyFilterDto[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialSelectedIds)
  )
  const [mode, setMode] = useState<SelectionMode>(initialMode)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  const debounceRef = useRef<number | null>(null)
  const skipRef = useRef(0)
  const modalRef = useRef<HTMLDialogElement>(null)

  // Load parties function
  async function loadParties(term: string, reset = true) {
    setLoading(true)

    const skip = reset ? 0 : skipRef.current

    try {
      const result = await loadPartiesForFilterAction({
        term,
        take: term ? 50 : 20,
        skip,
      })

      if (reset) {
        setParties(result.parties)
        skipRef.current = result.parties.length
      } else {
        setParties((prev) => [...prev, ...result.parties])
        skipRef.current += result.parties.length
      }

      setHasMore(result.hasMore)
      setTotal(result.total)
    } finally {
      setLoading(false)
    }
  }

  // Control modal visibility
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.showModal()
      skipRef.current = 0
      loadParties("")
    } else if (!isOpen && modalRef.current) {
      modalRef.current.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Search with debounce
  useEffect(() => {
    if (!isOpen) return

    if (debounceRef.current) window.clearTimeout(debounceRef.current)

    debounceRef.current = window.setTimeout(() => {
      skipRef.current = 0
      loadParties(searchTerm.trim())
    }, 300)

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, isOpen])

  // Reset when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("")
      setParties([])
      setSelectedIds(new Set(initialSelectedIds))
      setMode(initialMode)
      skipRef.current = 0
    }
  }, [isOpen, initialSelectedIds, initialMode])

  function toggleParty(id: string) {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedIds(newSelection)
  }

  function toggleAll() {
    if (selectedIds.size === parties.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(parties.map((p) => p.id)))
    }
  }

  function handleConfirm() {
    onConfirm(Array.from(selectedIds), mode)
    onClose()
  }

  function handleClear() {
    setSelectedIds(new Set())
  }

  function handleLoadMore() {
    if (!loading && hasMore) {
      loadParties(searchTerm.trim(), false)
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    // Close on backdrop click
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const allSelected = parties.length > 0 && selectedIds.size === parties.length
  const someSelected = selectedIds.size > 0 && !allSelected

  return (
    <dialog
      ref={modalRef}
      className="modal modal-bottom sm:modal-middle"
      onClick={handleBackdropClick}
    >
      <div
        className="modal-box w-11/12 max-w-5xl h-5/6 max-h-[80vh] flex flex-col p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-base-300 p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">{title}</h3>

            <button
              type="button"
              className="btn btn-ghost btn-sm btn-circle"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {/* Search input */}
            <div className="form-control">
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Buscar por nombre o teléfono…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            {/* Mode selector */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">Modo:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`btn btn-sm ${
                    mode === "include" ? "btn-primary" : "btn-ghost"
                  }`}
                  onClick={() => setMode("include")}
                >
                  ✓ Incluir
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    mode === "exclude" ? "btn-error" : "btn-ghost"
                  }`}
                  onClick={() => setMode("exclude")}
                >
                  ✕ Excluir
                </button>
              </div>
            </div>

            {/* Bulk actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected
                  }}
                  onChange={toggleAll}
                />
                <span className="text-sm">
                  {allSelected
                    ? `Todos (${parties.length})`
                    : someSelected
                      ? `${selectedIds.size} de ${total}`
                      : `0 de ${total}`}
                </span>
              </div>

              {selectedIds.size > 0 ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={handleClear}
                >
                  Limpiar
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Party list - scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && parties.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : parties.length === 0 ? (
            <div className="text-center py-12 opacity-70">
              <p>No se encontraron registros</p>
              {searchTerm ? (
                <p className="text-sm mt-2">
                  Intenta con otro término de búsqueda
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {parties.map((party) => {
                  const isSelected = selectedIds.has(party.id)

                  return (
                    <label
                      key={party.id}
                      className={`flex items-center gap-3 p-3 rounded-box border cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-base-300 hover:bg-base-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={isSelected}
                        onChange={() => toggleParty(party.id)}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{party.name}</div>
                        {party.phone ? (
                          <div className="text-sm opacity-70 truncate">
                            {party.phone}
                          </div>
                        ) : null}
                      </div>
                    </label>
                  )
                })}
              </div>

              {/* Load more button */}
              {hasMore ? (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      "Cargar más"
                    )}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-base-300 p-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm opacity-70">
              {selectedIds.size > 0 ? (
                <span>
                  <strong>{selectedIds.size}</strong>{" "}
                  {selectedIds.size === 1
                    ? "registro seleccionado"
                    : "registros seleccionados"}
                </span>
              ) : (
                <span>Ningún registro seleccionado</span>
              )}
            </div>

            <div className="flex gap-2">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirm}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}
