import { ArrowRight, Check, PackageCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { formatPrice } from '../data/products.js'

export default function OrderSuccess() {
  const location = useLocation()
  let order = location.state?.order
  if (!order) {
    try { order = JSON.parse(sessionStorage.getItem('shopease-last-order')) } catch { order = null }
  }
  return <main className="success-page"><div className="success-decoration">✳</div><div className="success-content"><div className="success-icon"><Check size={27} /></div><span className="eyebrow">THAT’S A WRAP</span><h1>Your good things<br /><em>are on their way.</em></h1><p>{order ? `Thanks, ${order.name}. Your demo order is all set.` : 'Thanks for stopping by ZORVIQUE. Find another little something for your day.'}</p>{order && <div className="success-order"><span><PackageCheck size={17} /> ORDER {order.number}</span><strong>{formatPrice(order.total)}</strong></div>}<div className="success-actions"><Link className="button button-primary" to="/shop">Find more good things <ArrowRight size={17} /></Link><Link to="/">Back to the homepage</Link></div><small>No payment was processed. This is a demo order.</small></div><div className="success-image"><img src="https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=85" alt="A thoughtfully wrapped parcel, ready to be enjoyed" /></div></main>
}