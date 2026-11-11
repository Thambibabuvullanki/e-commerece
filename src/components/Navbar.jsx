import { ArrowLeftRight, Heart, Menu, ShoppingBag, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useShop } from '../context/ShopContext.jsx'
import SearchBar from './SearchBar.jsx'

export default function Navbar() {
  const { cart, wishlist, user, logout, compareIds } = useShop()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const submitSearch = (event) => {
    event.preventDefault()
    navigate(`/shop${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ''}`)
    setMenuOpen(false)
  }

  return (
    <>
      <div className="announcement">A little something extra: free delivery on orders over ₹2,999</div>
      <header className="site-header">
        <div className="header-main container">
          <button className="icon-button mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <Link className="brand" to="/" aria-label="ZORVIQUE home"><span className="brand-mark">Z</span><span>ZORVIQUE<small>Everything You Love, All in One Place.</small></span></Link>
          <div className="desktop-search"><SearchBar value={query} onChange={(event) => setQuery(event.target.value)} onSubmit={submitSearch} /></div>
          <div className="header-actions">
            <Link to={user ? '/account' : '/login'} className="header-action"><UserRound size={20} /><span>{user ? user.name.split(' ')[0] : 'Account'}</span></Link>
            <Link to="/wishlist" className="header-action counted"><Heart size={20} /><span>Saved</span>{wishlist.length > 0 && <b>{wishlist.length}</b>}</Link>
            <Link to="/compare" className="header-action counted"><ArrowLeftRight size={20} /><span>Compare</span>{compareIds.length > 0 && <b>{compareIds.length}</b>}</Link>
            <Link to="/cart" className="header-action counted"><ShoppingBag size={20} /><span>Bag</span>{cart.length > 0 && <b>{cart.reduce((sum, item) => sum + item.quantity, 0)}</b>}</Link>
            {user && <button className="logout-button" onClick={logout}>Log out</button>}
          </div>
        </div>
        <div className="mobile-search container"><SearchBar value={query} onChange={(event) => setQuery(event.target.value)} onSubmit={submitSearch} /></div>
        <nav className={`category-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          <div className="container category-nav-inner">
            <NavLink to="/shop" onClick={() => setMenuOpen(false)}>Shop all</NavLink>
            <NavLink to="/shop?category=Electronics" onClick={() => setMenuOpen(false)}>Electronics</NavLink>
            <NavLink to="/shop?category=Fashion" onClick={() => setMenuOpen(false)}>Fashion</NavLink>
            <NavLink to="/shop?category=Shoes" onClick={() => setMenuOpen(false)}>Shoes</NavLink>
            <NavLink to="/shop?category=Home%20%26%20Kitchen" onClick={() => setMenuOpen(false)}>Home & kitchen</NavLink>
            <NavLink to="/shop?collection=new-arrivals" onClick={() => setMenuOpen(false)}>New arrivals</NavLink>
            <NavLink to="/find-my-product" onClick={() => setMenuOpen(false)}>Find my product</NavLink>
            <NavLink to="/shop?sale=true" onClick={() => setMenuOpen(false)} className="sale-link">On sale</NavLink>
          </div>
        </nav>
      </header>
    </>
  )
}