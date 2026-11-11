import { ArrowRight, BadgePercent, PackageCheck, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import CategoryCard from '../components/CategoryCard.jsx'
import Hero from '../components/Hero.jsx'
import ProductCard from '../components/ProductCard.jsx'
import RecentlyViewed from '../components/RecentlyViewed.jsx'
import { useShop } from '../context/ShopContext.jsx'

function SectionHeading({ eyebrow, title, action = '/shop', label = 'See everything' }) {
  return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><Link to={action}>{label}<ArrowRight size={16} /></Link></div>
}

export default function Home() {
  const { categories, products, brand } = useShop()
  const collectionPreview = products.filter((product) => product.brand === brand.name || product.tag === 'New').slice(0, 4)
  return <main><Hero /><section className="perks container"><div><PackageCheck /><span><b>Easy, free delivery</b><small>On orders over ₹2,999</small></span></div><div><ShieldCheck /><span><b>Shopping, made secure</b><small>Checkout with confidence</small></span></div><div><Sparkles /><span><b>Thoughtful quality</b><small>Good things, picked with care</small></span></div><div><BadgePercent /><span><b>Lovely little offers</b><small>Something for every budget</small></span></div></section>
    <section className="section-block container categories-section"><SectionHeading eyebrow="A GOOD PLACE TO START" title="Find your kind of good." /><div className="category-grid">{categories.map((category) => <CategoryCard key={category.name} category={category} />)}</div></section>
    <section className="section-block container finder-promo"><div><span className="eyebrow">NOT SURE WHERE TO START?</span><h2>Let’s find your next favorite.</h2><p>Tell us what you’re looking for and your budget. We’ll find a few good matches.</p><Link className="button button-primary" to="/find-my-product">Try the product finder <ArrowRight size={16} /></Link></div><Sparkles size={42} /></section>
    <section className="section-block container"><SectionHeading eyebrow="JUST LANDED" title="Meet the new collection." action="/shop?collection=new-arrivals" label="Shop new arrivals" /><div className="product-grid">{collectionPreview.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>
    <section className="section-block container"><SectionHeading eyebrow="THE GOOD STUFF" title="A few customer favorites." label="Shop bestsellers" /><div className="product-grid">{products.filter((item) => ['Bestseller', 'Top rated', 'Popular', 'Staff pick'].includes(item.tag)).slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}</div></section>
    <section className="offer-band"><div className="container offer-content"><div><span className="eyebrow">A LITTLE TREAT, ON US</span><h2>More good things.<br /><em>A little less.</em></h2><p>Find a new favorite and save up to 35% on selected everyday finds.</p><Link className="button button-dark" to="/shop?sale=true">Shop the offers <ArrowRight size={17} /></Link></div><div className="offer-image"><img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1100&q=85" alt="Carefully arranged clothing in a bright store" /><span>GOOD THINGS<br />ARE ON SALE</span></div><div className="offer-discount">UP TO <b>35%</b><small>OFF SELECT FINDS</small></div></div></section>
    <section className="section-block container"><SectionHeading eyebrow="THE GOOD DEALS" title="Sale picks worth finding." action="/shop?sale=true" label="Shop all sale products" /><div className="product-grid">{products.filter((product) => product.onSale).slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}</div></section>
    <section className="section-block container trending-section"><SectionHeading eyebrow="THE ONES YOU CAME BACK FOR" title="Trending, for good reason." /><div className="product-grid">{products.slice(4, 8).map((product) => <ProductCard key={product.id} product={product} />)}</div></section>
    <RecentlyViewed />
    <section className="quote-section"><div className="container quote-inner"><span className="quote-mark">“</span><blockquote>It’s the little things that make an ordinary day feel like a good one.</blockquote><span className="quote-credit">THE SHAPE OF SHOPPING, REIMAGINED</span><Link to="/shop">A little look around <ArrowRight size={15} /></Link></div></section>
  </main>
}