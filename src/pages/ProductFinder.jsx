import { ArrowRight, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'
import { useShop } from '../context/ShopContext.jsx'

export default function ProductFinder() {
  const { products, categories } = useShop()
  const [category, setCategory] = useState('')
  const [budget, setBudget] = useState('5000')
  const [submitted, setSubmitted] = useState(false)
  const suggestions = useMemo(() => products
    .filter((product) => product.inStock !== false && (!category || product.category === category) && product.price <= Number(budget))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4), [products, category, budget])

  return <main className="page-shell"><div className="container finder-page"><Link className="back-link" to="/shop">← Back to the shop</Link><header className="feature-page-heading"><span className="eyebrow"><Sparkles size={13} /> A LITTLE HELP FINDING YOURS</span><h1>Your good-find guide.</h1><p>Tell us what you’re shopping for and we’ll match you with top-rated picks in your budget.</p></header><form className="finder-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true) }}><label>What are you looking for?<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Anything good</option>{categories.map((item) => <option value={item.name} key={item.name}>{item.name}</option>)}</select></label><label>Your budget<select value={budget} onChange={(event) => setBudget(event.target.value)}><option value="1500">Up to ₹1,500</option><option value="3000">Up to ₹3,000</option><option value="5000">Up to ₹5,000</option><option value="10000">Any budget</option></select></label><button className="button button-primary" type="submit">Find my picks <ArrowRight size={16} /></button></form>{submitted && <section className="finder-results"><div className="section-heading"><div><span className="eyebrow">MATCHED TO YOUR PICKS</span><h2>{suggestions.length ? 'A few lovely matches.' : 'No matches this time.'}</h2></div><span>{suggestions.length} suggestions</span></div>{suggestions.length ? <div className="product-grid">{suggestions.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p>Try a higher budget or another category to see more finds.</p>}</section>}</div></main>
}
