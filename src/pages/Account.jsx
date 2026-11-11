import { ArrowRight, Heart, LogOut, ShoppingBag, UserRound } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useShop } from '../context/ShopContext.jsx'
import '../styles/account.css'

export default function Account() {
  const { user, logout, cart, wishlist, brand } = useShop()
  if (!user) return <Navigate to="/login" replace />
  return <main className="page-shell"><div className="container account-page"><span className="eyebrow">YOUR LITTLE CORNER</span><h1>Good to see you, {user.name}.</h1><p>Your {brand.name} details, all in one place.</p><div className="account-details"><span className="account-avatar"><UserRound size={23} /></span><div><strong>{user.name}</strong><small>{user.email}</small></div><button className="logout-button" onClick={logout}><LogOut size={15} /> Log out</button></div><div className="account-shortcuts"><Link to="/cart"><ShoppingBag size={21} /><span><b>Your bag</b><small>{cart.reduce((sum, item) => sum + item.quantity, 0)} items waiting</small></span><ArrowRight size={17} /></Link><Link to="/wishlist"><Heart size={21} /><span><b>Saved finds</b><small>{wishlist.length} things you love</small></span><ArrowRight size={17} /></Link></div></div></main>
}