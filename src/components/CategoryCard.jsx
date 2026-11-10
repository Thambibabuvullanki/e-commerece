import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CategoryCard({ category }) {
  return <Link className="category-card" to={`/shop?category=${encodeURIComponent(category.name)}`}><img src={category.image} alt="" /><span className="category-overlay" /><span className="category-card-copy"><small>{category.count}</small><strong>{category.name}</strong></span><span className="category-arrow"><ArrowUpRight size={17} /></span></Link>
}