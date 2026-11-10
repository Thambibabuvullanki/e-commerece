import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useShop } from '../context/ShopContext.jsx'
import { formatPrice } from '../data/products.js'

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useShop()
  return <article className="cart-item"><Link to={`/product/${item.id}`} className="cart-item-image"><img src={item.image} alt={item.name} /></Link><div className="cart-item-detail"><span>{item.category}</span><Link to={`/product/${item.id}`}><strong>{item.name}</strong></Link><small>{formatPrice(item.price)} each</small><div className="quantity-control"><button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`}><Minus size={14} /></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`}><Plus size={14} /></button></div></div><div className="cart-item-end"><strong>{formatPrice(item.price * item.quantity)}</strong><button className="remove-button" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}><Trash2 size={16} /></button></div></article>
}