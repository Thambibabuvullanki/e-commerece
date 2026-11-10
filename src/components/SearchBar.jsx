import { Search } from 'lucide-react'

export default function SearchBar({ value, onChange, onSubmit, placeholder = 'Search for anything...' }) {
  return (
    <form className="search-box" onSubmit={onSubmit} role="search">
      <Search size={18} aria-hidden="true" />
      <input value={value} onChange={onChange} placeholder={placeholder} aria-label="Search products" />
      <button type="submit" aria-label="Submit search">Search</button>
    </form>
  )
}