import { Heart, ShoppingBag, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useShop } from '../context/ShopContext.jsx'
import { formatPrice } from '../data/products.js'

export default function ProductCard({ product }) {
  const { addToCart, wishlist, toggleWishlist } = useShop()
  const saved = wishlist.some((item) => item.id === product.id)
  const discount = Math.round((1 - product.price / product.originalPrice) * 100)
  return (
    <article className="product-card">
      <div className="product-image-wrap"><Link to={`/product/${product.id}`} aria-label={`View ${product.name}`}><img src={product.image} alt={product.name} loading="lazy" /></Link>{(product.onSale || product.tag) && <span className="product-tag">{product.onSale ? 'Sale' : product.tag}</span>}<span className="discount-tag">-{discount}%</span><button className={`wishlist-button ${saved ? 'is-saved' : ''}`} aria-label={saved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} onClick={() => toggleWishlist(product)}><Heart size={17} fill={saved ? 'currentColor' : 'none'} /></button><button className="quick-add" onClick={() => addToCart(product)}><ShoppingBag size={15} /> Quick add</button></div>
      <div className="product-info"><span className="product-category">{product.category}</span><Link className="product-name" to={`/product/${product.id}`}>{product.name}</Link><div className="product-rating"><Star size={13} fill="currentColor" /><b>{product.rating}</b><span>({product.reviews})</span></div><div className="product-price"><strong>{formatPrice(product.price)}</strong><del>{formatPrice(product.originalPrice)}</del></div></div>
    </article>
  )
}