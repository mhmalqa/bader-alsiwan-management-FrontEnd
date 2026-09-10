'use client'

import { ChevronDown, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

type Option = { value: string; label: string }
type Props = { value: string; onChange: (value: string) => void; options: Option[]; placeholder: string; disabled?: boolean; required?: boolean }

export function SearchableSelect({ value, onChange, options, placeholder, disabled, required }: Props) {
  const selected = options.find((item) => item.value === value)
  const [query, setQuery] = useState(selected?.label ?? '')
  const [open, setOpen] = useState(false)
  const inputValue = open ? query : (selected?.label ?? query)
  const filtered = useMemo(() => options.filter((item) => item.label.toLocaleLowerCase('ar').includes(query.toLocaleLowerCase('ar'))), [options, query])
  return <div className={`searchable-select ${open ? 'open' : ''}`}><Search className="search-icon" size={16} /><input required={required} disabled={disabled} value={inputValue} onFocus={() => { setQuery(selected?.label ?? query); setOpen(true) }} onChange={(event) => { setQuery(event.target.value); setOpen(true); if (!event.target.value) onChange('') }} placeholder={placeholder} autoComplete="off" /><ChevronDown className="select-chevron" size={17} />{open && !disabled && <div className="searchable-options" role="listbox">{filtered.length ? filtered.map((item) => <button type="button" role="option" aria-selected={item.value === value} key={item.value} onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(item.value); setQuery(item.label); setOpen(false) }}>{item.label}</button>) : <p>لا توجد نتائج مطابقة</p>}</div>}</div>
}
