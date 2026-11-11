import { ArrowRight, ImagePlus, PackagePlus, Pencil, Save, ShieldCheck, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { apiRequest } from '../api.js'
import { useShop } from '../context/ShopContext.jsx'
import { formatPrice } from '../data/products.js'
import '../styles/admin.css'

const blankProduct = {
  name: '',
  category: 'Electronics',
  brand: '',
  price: '',
  originalPrice: '',
  rating: '0',
  reviews: '0',
  tag: '',
  image: '',
  description: '',
  onSale: false,
  inStock: true,
}

function ProductFields({ product, onChange }) {
  const set = (key, value) => onChange((current) => ({ ...current, [key]: value }))
  return <>
    <div className="admin-form-grid">
      <label>Product name<input required maxLength="120" value={product.name} onChange={(event) => set('name', event.target.value)} placeholder="Product name" /></label>
      <label>Category<input required maxLength="60" value={product.category} onChange={(event) => set('category', event.target.value)} placeholder="e.g. Electronics" /></label>
      <label>Brand<input maxLength="60" value={product.brand || ''} onChange={(event) => set('brand', event.target.value)} placeholder="Optional" /></label>
      <label>Tag<input maxLength="40" value={product.tag || ''} onChange={(event) => set('tag', event.target.value)} placeholder="e.g. Bestseller" /></label>
      <label>Selling price (₹)<input type="number" min="1" step="1" required value={product.price} onChange={(event) => set('price', event.target.value)} /></label>
      <label>Original price (₹)<input type="number" min="1" step="1" required value={product.originalPrice} onChange={(event) => set('originalPrice', event.target.value)} /></label>
      <label>Rating (0–5)<input type="number" min="0" max="5" step="0.1" value={product.rating} onChange={(event) => set('rating', event.target.value)} /></label>
      <label>Review count<input type="number" min="0" step="1" value={product.reviews} onChange={(event) => set('reviews', event.target.value)} /></label>
      <label className="admin-full-width">Product image URL<input type="url" required maxLength="1000" value={product.image} onChange={(event) => set('image', event.target.value)} placeholder="https://…" /></label>
      <label className="admin-full-width">Description<textarea required maxLength="2000" rows="3" value={product.description} onChange={(event) => set('description', event.target.value)} placeholder="Describe this product" /></label>
    </div>
    <div className="admin-checks">
      <label><input type="checkbox" checked={Boolean(product.onSale)} onChange={(event) => set('onSale', event.target.checked)} /> Mark as on sale</label>
      <label><input type="checkbox" checked={product.inStock !== false} onChange={(event) => set('inStock', event.target.checked)} /> In stock</label>
    </div>
  </>
}

export default function Admin() {
  const { user, products, brand, refreshStorefront } = useShop()
  const [items, setItems] = useState(products)
  const [form, setForm] = useState(blankProduct)
  const [editingId, setEditingId] = useState(null)
  const [brandForm, setBrandForm] = useState(brand)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { setItems(products) }, [products])
  useEffect(() => { setBrandForm(brand) }, [brand])

  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace state={{ from: '/admin' }} />

  const clearNotice = () => { setError(''); setMessage('') }
  const refreshItems = async () => {
    const { products: latest } = await apiRequest('/admin/products')
    setItems(latest)
    await refreshStorefront()
  }
  const startEdit = (product) => {
    clearNotice()
    setEditingId(product.id)
    setForm({ ...product, price: String(product.price), originalPrice: String(product.originalPrice), rating: String(product.rating), reviews: String(product.reviews) })
    document.getElementById('admin-product-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const startAdd = () => {
    clearNotice()
    setEditingId(null)
    setForm(blankProduct)
    document.getElementById('admin-product-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const saveProduct = async (event) => {
    event.preventDefault()
    clearNotice()
    setBusy(true)
    const product = {
      ...form,
      price: Number(form.price),
      originalPrice: Number(form.originalPrice),
      rating: Number(form.rating),
      reviews: Number(form.reviews),
    }
    try {
      await apiRequest(editingId ? `/admin/products/${encodeURIComponent(editingId)}` : '/admin/products', {
        method: editingId ? 'PUT' : 'POST',
        body: product,
      })
      await refreshItems()
      setMessage(editingId ? 'Product changes saved.' : 'Product added to your store.')
      setEditingId(null)
      setForm(blankProduct)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }
  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete “${product.name}” from the store? This cannot be undone.`)) return
    clearNotice()
    try {
      await apiRequest(`/admin/products/${encodeURIComponent(product.id)}`, { method: 'DELETE' })
      await refreshItems()
      setMessage('Product deleted.')
      if (editingId === product.id) {
        setEditingId(null)
        setForm(blankProduct)
      }
    } catch (requestError) {
      setError(requestError.message)
    }
  }
  const saveBrand = async (event) => {
    event.preventDefault()
    clearNotice()
    setBusy(true)
    try {
      await apiRequest('/admin/brand', { method: 'PUT', body: brandForm })
      await refreshStorefront()
      setMessage('Store name and branding saved.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return <main className="page-shell admin-page"><div className="container">
    <header className="admin-heading"><div><span className="eyebrow"><ShieldCheck size={14} /> STORE ADMINISTRATION</span><h1>Your store, your way.</h1><p>Manage the products and branding customers see across your storefront.</p></div><Link className="button admin-store-link" to="/">View storefront <ArrowRight size={15} /></Link></header>
    {message && <div className="admin-notice admin-notice-success" role="status">{message}</div>}
    {error && <div className="admin-notice admin-notice-error" role="alert">{error}</div>}
    <section className="admin-brand-panel" id="admin-brand">
      <div className="admin-panel-heading"><span className="admin-panel-icon"><ImagePlus size={19} /></span><div><h2>Store identity</h2><p>Update your store name, tagline, and logo image URL.</p></div></div>
      <form className="admin-brand-form" onSubmit={saveBrand}>
        <div className="admin-brand-preview">{brandForm.logoUrl ? <img src={brandForm.logoUrl} alt="Store logo preview" /> : <span>{brandForm.name?.slice(0, 1) || 'S'}</span>}<div><strong>{brandForm.name || 'Your store name'}</strong><small>{brandForm.tagline || 'Your store tagline'}</small></div></div>
        <div className="admin-form-grid">
          <label>Store name<input required maxLength="60" value={brandForm.name || ''} onChange={(event) => setBrandForm((current) => ({ ...current, name: event.target.value }))} /></label>
          <label>Tagline<input maxLength="120" value={brandForm.tagline || ''} onChange={(event) => setBrandForm((current) => ({ ...current, tagline: event.target.value }))} placeholder="A short line about your store" /></label>
          <label className="admin-full-width">Logo image URL<input type="url" maxLength="1000" value={brandForm.logoUrl || ''} onChange={(event) => setBrandForm((current) => ({ ...current, logoUrl: event.target.value }))} placeholder="https://… (leave blank to use the initial)" /></label>
        </div>
        <button className="button button-primary" disabled={busy}><Save size={15} /> Save store identity</button>
      </form>
    </section>
    <div className="admin-catalog-heading" id="admin-products"><div><span className="eyebrow">YOUR CATALOG</span><h2>Products <span>{items.length}</span></h2></div><button className="button button-primary" onClick={startAdd}><PackagePlus size={16} /> Add a product</button></div>
    <section className="admin-product-editor" id="admin-product-editor">
      <div className="admin-panel-heading"><span className="admin-panel-icon"><PackagePlus size={19} /></span><div><h2>{editingId ? 'Edit product' : 'Add a product'}</h2><p>{editingId ? 'Update the details shown on the storefront.' : 'Add something new to your customer catalog.'}</p></div></div>
      <form onSubmit={saveProduct}><ProductFields product={form} onChange={setForm} /><div className="admin-form-actions"><button className="button button-primary" disabled={busy}><Save size={15} /> {busy ? 'Saving…' : editingId ? 'Save product' : 'Add product'}</button>{editingId && <button type="button" className="button admin-cancel" onClick={startAdd}>Cancel</button>}</div></form>
    </section>
    <section className="admin-product-list" aria-label="Manage products">
      {items.map((product) => <article className="admin-product-row" key={product.id}><img src={product.image} alt="" /><div className="admin-product-copy"><strong>{product.name}</strong><small>{product.category} · {formatPrice(product.price)}{product.inStock === false ? ' · Out of stock' : ''}</small></div><button className="admin-icon-action" onClick={() => startEdit(product)} aria-label={`Edit ${product.name}`}><Pencil size={16} /></button><button className="admin-icon-action admin-delete-action" onClick={() => deleteProduct(product)} aria-label={`Delete ${product.name}`}><Trash2 size={16} /></button></article>)}
      {!items.length && <div className="empty-state"><h2>Your catalog is empty.</h2><p>Add your first product using the form above.</p></div>}
    </section>
  </div></main>
}
