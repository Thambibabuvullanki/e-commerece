import { ArrowLeft, ArrowLeftRight, ShoppingBag, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useShop } from '../context/ShopContext.jsx'
import { formatPrice } from '../data/products.js'

export default function Compare() {
  const { products, compareIds, toggleCompare, addToCart } = useShop()
  const compared = compareIds.map((id) => products.find((product) => product.id === id)).filter(Boolean)
  if (!compared.length) {
    return <main className="page-shell"><div className="container compare-page"><Link className="back-link" to="/shop"><ArrowLeft size={15} /> Back to the shop</Link><div className="empty-state"><span><ArrowLeftRight size={25} /></span><h2>Your comparison is ready when you are.</h2><p>Add up to four products with the Compare button to see them side by side.</p><Link className="button button-primary" to="/shop">Explore products</Link></div></div></main>
  }
  const rows = [
    ['Price', (product) => formatPrice(product.price)],
    ['Category', (product) => product.category],
    ['Rating', (product) => `${product.rating} / 5 (${product.reviews} reviews)`],
    ['About', (product) => product.description],
  ]
  return <main className="page-shell"><div className="container compare-page"><Link className="back-link" to="/shop"><ArrowLeft size={15} /> Back to the shop</Link><header className="feature-page-heading"><span className="eyebrow">A SIDE-BY-SIDE LOOK</span><h1>Compare your finds.</h1><p>Choose the one that feels right for you. Compare up to four products.</p></header><div className="compare-table-wrap"><table className="compare-table"><thead><tr><th scope="col">At a glance</th>{compared.map((product) => <th scope="col" key={product.id}><button className="compare-remove" onClick={() => toggleCompare(product.id)} aria-label={`Remove ${product.name} from comparison`}><X size={15} /></button><Link to={`/product/${product.id}`}><img src={product.image} alt="" /><strong>{product.name}</strong></Link><button className="button button-primary compare-add" onClick={() => addToCart(product)}><ShoppingBag size={14} /> Add to bag</button></th>)}</tr></thead><tbody>{rows.map(([label, value]) => <tr key={label}><th scope="row">{label}</th>{compared.map((product) => <td key={product.id}>{value(product)}</td>)}</tr>)}</tbody></table></div></div></main>
}
