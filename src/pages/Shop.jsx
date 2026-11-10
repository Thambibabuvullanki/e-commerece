import { SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'
import { useShop } from '../context/ShopContext.jsx'

export default function Shop() {
  const { categories, products } = useShop()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sort, setSort] = useState('featured')
  const isNewCollection = searchParams.get('collection') === 'new-arrivals'
  const category = searchParams.get('category') || (isNewCollection ? 'New arrivals' : 'All products')
  const search = searchParams.get('search') || ''
  const isSale = searchParams.get('sale') === 'true'
  const filtered = useMemo(() => {
    let result = products.filter((product) => (category === 'All products' || isNewCollection || product.category === category) && product.name.toLowerCase().includes(search.toLowerCase()) && (!isSale || product.onSale))
    if (sort === 'low') result = [...result].sort((a, b) => a.price - b.price)
    if (sort === 'high') result = [...result].sort((a, b) => b.price - a.price)
    if (sort === 'rating') result = [...result].sort((a, b) => b.rating - a.rating)
    return result
  }, [category, isNewCollection, search, isSale, sort])
  const chooseCategory = (value) => {
    const next = new URLSearchParams(searchParams)
    next.delete('collection')
    if (value === 'All products') next.delete('category')
    else next.set('category', value)
    setSearchParams(next)
  }

  return <main className="page-shell"><div className="container"><div className="page-title-row"><div><span className="eyebrow">A THOUGHTFUL LITTLE COLLECTION</span><h1>{isSale ? 'The good deals.' : category === 'All products' ? 'Find your favorite.' : category}</h1><p>Good quality, lovely details, and a price that feels just right.</p></div><div className="catalog-count">{filtered.length} lovely finds</div></div>
    <div className="catalog-layout"><aside className="filter-sidebar"><div className="filter-title"><SlidersHorizontal size={17} /><strong>Browse by</strong></div><button className={category === 'All products' ? 'active' : ''} onClick={() => chooseCategory('All products')}>All products <span>{products.length}</span></button>{categories.map((item) => <button key={item.name} className={category === item.name ? 'active' : ''} onClick={() => chooseCategory(item.name)}>{item.name}<span>{products.filter((product) => product.category === item.name).length}</span></button>)}</aside>
      <div className="catalog-content"><div className="catalog-toolbar"><span>{search ? `Results for “${search}”` : 'Curated for your everyday'}</span><label>Sort by <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="rating">Top rated</option></select></label></div>
        {filtered.length ? <div className="product-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><span>✳</span><h2>No finds just yet.</h2><p>Try a different search or browse another category.</p><button className="button button-primary" onClick={() => { setSearchParams({}); }}>See all products</button></div>}
      </div>
    </div></div></main>
}