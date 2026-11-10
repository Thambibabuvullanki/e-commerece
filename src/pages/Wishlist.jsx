import { ArrowRight, Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useShop } from '../context/ShopContext.jsx'
import { formatPrice } from '../data/products.js'

export default function Wishlist() {
  const { wishlist, toggleWishlist, moveToCart } = useShop()
  return <main className="page-shell"><div className="container"><div className="page-title-row"><div><span className="eyebrow">THE ONES YOU LOVE</span><h1>Your saved finds<span className="title-count">{wishlist.length}</span></h1><p>Keep the good ones close until you’re ready.</p></div><Link className="back-link" to="/shop">Back to the shop <ArrowRight size={15} /></Link></div>
    {wishlist.length ? <div className="wishlist-grid">{wishlist.map((product) => <article className="saved-card" key={product.id}><Link to={`/product/${product.id}`} className="saved-image"><img src={product.image} alt={product.name} /></Link><div className="saved-info"><span>{product.category}</span><Link to={`/product/${product.id}`}><strong>{product.name}</strong></Link><b>{formatPrice(product.price)}</b><div><button className="button button-primary" onClick={() => moveToCart(product)}><ShoppingBag size={15} /> Move to bag</button><button className="saved-remove" onClick={() => toggleWishlist(product)} aria-label={`Remove ${product.name}`}><Trash2 size={16} /></button></div></div></article>)}</div> : <div className="empty-state"><span><Heart size={25} /></span><h2>Keep a little list of lovely things.</h2><p>Tap the heart on anything you love and it’ll be here when you’re ready.</p><Link className="button button-primary" to="/shop">Browse good finds <ArrowRight size={16} /></Link></div>}
    </div></main>
}