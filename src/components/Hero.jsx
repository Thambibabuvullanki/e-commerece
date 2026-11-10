import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="hero container">
      <div className="hero-copy"><span className="eyebrow"><i /> THE LITTLE THINGS, FOUND</span><h1>Good things<br />find their way <em>here.</em></h1><p>Everyday favorites, considered details, and a few lovely surprises. Make room for something good.</p><Link className="button button-primary" to="/shop">Find your favorite <ArrowRight size={17} /></Link><div className="hero-proof"><div className="proof-avatars"><span>R</span><span>M</span><span>A</span><span>+</span></div><div><strong>Loved by 12,000+ shoppers</strong><small>Little wins, delivered daily</small></div></div></div>
      <div className="hero-visual"><img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=90" alt="A bright, welcoming boutique with curated everyday finds" /><div className="hero-image-wash" /><div className="hero-note"><span>THE GOOD FINDS EDIT</span><strong>Everyday, elevated.</strong><Link to="/shop">Explore the collection <ArrowRight size={14} /></Link></div><div className="hero-stamp"><span>MADE FOR</span><b>your<br />everyday</b><i>✳</i></div></div>
      <div className="hero-bottomline"><span>GOOD TASTE. GOOD VALUE. GOOD DAY.</span><span>01 — NEW SEASON, NEW FAVORITES</span></div>
    </section>
  )
}