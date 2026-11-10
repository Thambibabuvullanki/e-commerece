import { ArrowLeft, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Star, Truck } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'
import { useShop } from '../context/ShopContext.jsx'
import { formatPrice } from '../data/products.js'

export default function ProductDetails() {
  const { id } = useParams()
  const product = products.find((item) => item.id === id)
  const { addToCart, wishlist, toggleWishlist, products } = useShop()
  const [quantity, setQuantity] = useState(1)
  const navigate = useNavigate()
  if (!product) return <main className="page-shell"><div className="empty-state"><h2>We couldn’t find that one.</h2><Link className="button button-primary" to="/shop">Back to the shop</Link></div></main>
  const saved = wishlist.some((item) => item.id === product.id)
  const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4)
  const addAndGo = () => { addToCart(product, quantity); navigate('/cart') }
  return <main className="page-shell"><div className="container"><Link className="back-link" to="/shop"><ArrowLeft size={15} /> Back to the good stuff</Link><div className="detail-layout"><div className="detail-image"><img src={product.image} alt={product.name} /><span>{product.tag || 'A good find'}</span></div><div className="detail-copy"><span className="eyebrow">{product.category.toUpperCase()}</span><h1>{product.name}</h1><div className="detail-rating"><Star size={15} fill="currentColor" /><b>{product.rating}</b><span>Based on {product.reviews} reviews</span></div><div className="detail-price"><strong>{formatPrice(product.price)}</strong><del>{formatPrice(product.originalPrice)}</del><span>Save {Math.round((1 - product.price / product.originalPrice) * 100)}%</span></div><p>{product.description}</p><div className="detail-actions"><div className="quantity-control"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus size={15} /></button><span>{quantity}</span><button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity"><Plus size={15} /></button></div><button className="button button-primary" onClick={addAndGo}><ShoppingBag size={17} /> Add to bag</button><button className={`icon-button detail-wishlist ${saved ? 'is-saved' : ''}`} onClick={() => toggleWishlist(product)} aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}><Heart size={19} fill={saved ? 'currentColor' : 'none'} /></button></div><div className="detail-assurances"><span><Truck size={17} /> Free delivery over ₹2,999</span><span><ShieldCheck size={17} /> Secure demo checkout</span></div><div className="detail-note"><b>A little note</b><span>Good things should feel good. We pick each find for its quality, usefulness, and the small joy it brings to an ordinary day.</span></div></div></div>
    {related.length > 0 && <section className="section-block detail-related"><div className="section-heading"><div><span className="eyebrow">MORE TO LOVE</span><h2>Made for your kind of day.</h2></div></div><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}</div></main>
}