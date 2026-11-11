import { Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Footer from './components/Footer.jsx'
import Navbar from './components/Navbar.jsx'
import Auth from './pages/Auth.jsx'
import Account from './pages/Account.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import Home from './pages/Home.jsx'
import OrderSuccess from './pages/OrderSuccess.jsx'
import OrderTracking from './pages/OrderTracking.jsx'
import Compare from './pages/Compare.jsx'
import ProductFinder from './pages/ProductFinder.jsx'
import ProductDetails from './pages/ProductDetails.jsx'
import Shop from './pages/Shop.jsx'
import Wishlist from './pages/Wishlist.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return <><ScrollToTop /><Navbar /><Routes><Route path="/" element={<Home />} /><Route path="/shop" element={<Shop />} /><Route path="/product/:id" element={<ProductDetails />} /><Route path="/cart" element={<Cart />} /><Route path="/wishlist" element={<Wishlist />} /><Route path="/compare" element={<Compare />} /><Route path="/find-my-product" element={<ProductFinder />} /><Route path="/login" element={<Auth />} /><Route path="/register" element={<Auth mode="register" />} /><Route path="/account" element={<Account />} /><Route path="/checkout" element={<Checkout />} /><Route path="/order-success" element={<OrderSuccess />} /><Route path="/track-order" element={<OrderTracking />} /><Route path="*" element={<Home />} /></Routes><Footer /></>
}