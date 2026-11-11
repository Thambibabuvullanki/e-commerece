import { createContext, useContext, useEffect, useState } from 'react'
import { apiRequest } from '../api.js'
import { categories as fallbackCategories, products as fallbackProducts } from '../data/products.js'

const ShopContext = createContext(null)

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

export function ShopProvider({ children }) {
  const [cart, setCart] = useState(() => readStorage('shopease-cart', []))
  const [wishlist, setWishlist] = useState(() => readStorage('shopease-wishlist', []))
  const [compareIds, setCompareIds] = useState(() => readStorage('shopease-compare', []))
  const [viewedIds, setViewedIds] = useState(() => readStorage('shopease-recently-viewed', []))
  const [bundleProductIds, setBundleProductIds] = useState(() => readStorage('shopease-bundle', []))
  const [user, setUser] = useState(null)
  const [products, setProducts] = useState(fallbackProducts)
  const [categories, setCategories] = useState(fallbackCategories)
  const [accountReady, setAccountReady] = useState(false)

  useEffect(() => {
    localStorage.setItem('shopease-compare', JSON.stringify(compareIds))
    localStorage.setItem('shopease-recently-viewed', JSON.stringify(viewedIds))
    localStorage.setItem('shopease-bundle', JSON.stringify(bundleProductIds))
  }, [compareIds, viewedIds, bundleProductIds])

  useEffect(() => {
    let active = true
    apiRequest('/products').then(({ products: apiProducts }) => {
      if (active && Array.isArray(apiProducts)) setProducts(apiProducts)
    }).catch(() => {})
    apiRequest('/categories').then(({ categories: apiCategories }) => {
      if (active && Array.isArray(apiCategories)) setCategories(apiCategories)
    }).catch(() => {})
    apiRequest('/auth/me').then(({ user: apiUser }) => {
      if (active && apiUser) setUser(apiUser)
    }).catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (user) {
      localStorage.removeItem('shopease-cart')
      localStorage.removeItem('shopease-wishlist')
    } else {
      localStorage.setItem('shopease-cart', JSON.stringify(cart))
      localStorage.setItem('shopease-wishlist', JSON.stringify(wishlist))
    }
  }, [cart, wishlist, user])

  useEffect(() => {
    if (!user) {
      setAccountReady(false)
      return
    }
    let active = true
    apiRequest('/account/sync', {
      method: 'POST',
      body: {
        cart: cart.map(({ id, quantity }) => ({ id, quantity })),
        wishlist: wishlist.map(({ id }) => ({ id })),
      },
    }).then((state) => {
      if (!active) return
      setCart(state.cart)
      setWishlist(state.wishlist)
      setAccountReady(true)
    }).catch(() => {
      if (active) setAccountReady(true)
    })
    return () => { active = false }
  }, [user?.id])

  useEffect(() => {
    if (!user || !accountReady) return
    apiRequest('/account/state', {
      method: 'PUT',
      body: {
        cart: cart.map(({ id, quantity }) => ({ id, quantity })),
        wishlist: wishlist.map(({ id }) => ({ id })),
      },
    }).catch(() => {})
  }, [cart, wishlist, user, accountReady])

  const addToCart = (product, quantity = 1) => setCart((items) => {
    const existing = items.find((item) => item.id === product.id)
    return existing
      ? items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)
      : [...items, { ...product, quantity }]
  })
  const removeFromCart = (id) => {
    setCart((items) => items.filter((item) => item.id !== id))
    setBundleProductIds((ids) => ids.includes(id) ? [] : ids)
  }
  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return removeFromCart(id)
    setCart((items) => items.map((item) => item.id === id ? { ...item, quantity } : item))
  }
  const toggleWishlist = (product) => setWishlist((items) =>
    items.some((item) => item.id === product.id)
      ? items.filter((item) => item.id !== product.id)
      : [...items, product],
  )
  const moveToCart = (product) => {
    addToCart(product)
    setWishlist((items) => items.filter((item) => item.id !== product.id))
  }
  const toggleCompare = (productId) => {
    if (compareIds.includes(productId)) {
      setCompareIds((ids) => ids.filter((id) => id !== productId))
      return true
    }
    if (compareIds.length >= 4) return false
    setCompareIds((ids) => [...ids, productId])
    return true
  }
  const recordProductView = (productId) => setViewedIds((ids) => [
    productId,
    ...ids.filter((id) => id !== productId),
  ].slice(0, 8))
  const addBundleToCart = (items) => {
    setCart((current) => items.reduce((next, product) => {
      const existing = next.find((item) => item.id === product.id)
      return existing
        ? next
        : [...next, { ...product, quantity: 1 }]
    }, current))
    setBundleProductIds(items.map(({ id }) => id))
  }
  const logout = async () => {
    try { await apiRequest('/auth/logout', { method: 'POST' }) } catch {}
    setAccountReady(false)
    setCart([])
    setWishlist([])
    setBundleProductIds([])
    setUser(null)
  }

  return (
    <ShopContext.Provider value={{ cart, wishlist, user, setUser, logout, products, categories, addToCart, removeFromCart, updateQuantity, toggleWishlist, moveToCart, setCart, compareIds, toggleCompare, viewedIds, recordProductView, bundleProductIds, addBundleToCart }}>
      {children}
    </ShopContext.Provider>
  )
}

export const useShop = () => useContext(ShopContext)