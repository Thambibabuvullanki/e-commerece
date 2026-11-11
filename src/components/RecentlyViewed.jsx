import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductCard from './ProductCard.jsx'
import { useShop } from '../context/ShopContext.jsx'

export default function RecentlyViewed() {
  const { products, viewedIds } = useShop()
  const viewedProducts = viewedIds.map((id) => products.find((product) => product.id === id)).filter(Boolean)
  if (!viewedProducts.length) return null

  return <section className="section-block container"><div className="section-heading"><div><span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>Recently viewed.</h2></div><Link to="/shop">Browse more <ArrowRight size={16} /></Link></div><div className="product-grid">{viewedProducts.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}</div></section>
}
