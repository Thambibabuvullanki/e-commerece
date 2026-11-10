import { ArrowLeft, ArrowRight, LockKeyhole, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import CartItem from '../components/CartItem.jsx'
import { useShop } from '../context/ShopContext.jsx'
import { formatPrice } from '../data/products.js'

export default function Cart() {
  const { cart } = useShop()
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const delivery = subtotal === 0 || subtotal >= 2999 ? 0 : 99
  return <main className="page-shell"><div className="container"><div className="page-title-row"><div><span className="eyebrow">YOUR GOOD FINDS, TOGETHER</span><h1>Your bag<span className="title-count">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span></h1><p>A few lovely things, on their way to you.</p></div><Link className="back-link" to="/shop"><ArrowLeft size={15} /> Keep looking</Link></div>
    {cart.length ? <div className="cart-layout"><section className="cart-list">{cart.map((item) => <CartItem key={item.id} item={item} />)}<div className="delivery-note"><ShoppingBag size={17} /><span>{subtotal >= 2999 ? 'Your delivery is on us. Lovely choice.' : `Add ${formatPrice(2999 - subtotal)} more for free delivery.`}</span></div></section><aside className="order-summary"><h2>The little details</h2><div className="summary-line"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="summary-line"><span>Delivery</span><span>{delivery === 0 ? 'On us' : formatPrice(delivery)}</span></div><div className="summary-line summary-total"><strong>Total</strong><strong>{formatPrice(subtotal + delivery)}</strong></div><small>Taxes are included in the item price.</small><Link className="button button-primary checkout-button" to="/checkout">Continue to checkout <ArrowRight size={17} /></Link><span className="secure-note"><LockKeyhole size={13} /> Secure demo checkout</span></aside></div> : <div className="empty-state cart-empty"><span><ShoppingBag size={25} /></span><h2>Your bag’s taking a little breather.</h2><p>There’s plenty of good stuff waiting to come home with you.</p><Link className="button button-primary" to="/shop">Find something good <ArrowRight size={16} /></Link></div>}
    </div></main>
}