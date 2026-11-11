import { ArrowRight, Instagram, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useShop } from '../context/ShopContext.jsx'

export default function Footer() {
  const { brand, user } = useShop()
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand"><Link className="brand brand-inverted" to="/">{brand.logoUrl ? <img className="brand-logo-image" src={brand.logoUrl} alt="" /> : <span className="brand-mark">{brand.name.slice(0, 1)}</span>}<span>{brand.name}<small>{brand.tagline}</small></span></Link><p>Thoughtful finds for the life you live. The everyday, made a little more special.</p><a className="social-link" href="https://instagram.com" target="_blank" rel="noreferrer" aria-label={`${brand.name} on Instagram`}><Instagram size={18} /></a></div>
        <div className="footer-links"><h3>Explore</h3><Link to="/shop">Shop all</Link><Link to="/shop?category=Fashion">Fashion</Link><Link to="/shop?category=Electronics">Electronics</Link><Link to="/shop?sale=true">Special offers</Link></div>
        <div className="footer-links"><h3>Need a hand?</h3><a href="mailto:hello@zorvique.example">Contact us</a><Link to="/cart">Your bag</Link><Link to="/wishlist">Saved items</Link><Link to="/login">Your account</Link>{user?.role === 'admin' && <Link to="/admin">Store administration</Link>}</div>
        <div className="newsletter"><h3>A good note, now and then.</h3><p>New finds and little perks. No noise.</p><form onSubmit={(event) => { event.preventDefault(); event.currentTarget.reset(); window.alert('You’re on the list. Thanks for joining!') }}><input type="email" placeholder="Your email address" aria-label="Email for newsletter" required /><button aria-label="Subscribe"><ArrowRight size={18} /></button></form><span><Send size={13} /> A fresh note, only when it matters.</span></div>
      </div>
      <div className="footer-bottom"><div className="container"><span>© 2026 {brand.name}. {brand.tagline}</span><span>Thoughtful shopping, made easy.</span></div></div>
    </footer>
  )
}