import { ArrowLeft, ArrowRight, Check, CreditCard, LocateFixed, MapPin, PackageCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api.js'
import { useShop } from '../context/ShopContext.jsx'
import { formatPrice } from '../data/products.js'

export default function Checkout() {
  const { cart, setCart, user, bundleProductIds, setBundleProductIds } = useShop()
  const [payment, setPayment] = useState('cod')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [gpsLocation, setGpsLocation] = useState(null)
  const [gpsStatus, setGpsStatus] = useState('')
  const [locating, setLocating] = useState(false)
  const navigate = useNavigate()
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const delivery = subtotal >= 2999 ? 0 : 99
  const bundleItems = bundleProductIds.map((id) => cart.find((item) => item.id === id)).filter(Boolean)
  const bundleDiscount = bundleItems.length === 2 ? Math.round(bundleItems.reduce((sum, item) => sum + item.price, 0) * 0.1) : 0
  if (!cart.length && !orderPlaced) return <Navigate to="/cart" replace />
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Location services are not available in this browser.')
      return
    }
    setLocating(true)
    setGpsStatus('')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setGpsLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        })
        setGpsStatus('GPS delivery point saved for this order.')
        setLocating(false)
      },
      (error) => {
        const messages = {
          1: 'Location permission was denied. You can still enter your address manually.',
          2: 'Your location could not be determined. Try again or enter your address manually.',
          3: 'Location lookup timed out. Try again or enter your address manually.',
        }
        setGpsStatus(messages[error.code] || 'Unable to get your location. Please enter your address manually.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
  }
  const placeOrder = async (event) => {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))
    try {
      const { order } = await apiRequest('/orders', {
        method: 'POST',
        body: { ...data, payment, location: gpsLocation, bundleProductIds: bundleDiscount ? bundleProductIds : undefined, items: cart.map(({ id, quantity }) => ({ id, quantity })) },
      })
      sessionStorage.setItem('shopease-last-order', JSON.stringify(order))
      setOrderPlaced(true)
      setCart([])
      setBundleProductIds([])
      navigate('/order-success', { state: { order } })
    } catch (error) {
      window.alert(error.message)
    }
  }
  return <main className="page-shell"><div className="container"><Link className="back-link" to="/cart"><ArrowLeft size={15} /> Back to your bag</Link><div className="checkout-title"><span className="eyebrow">THE LAST LITTLE STEP</span><h1>Let’s get it to you.</h1><p>Just the details we need to bring your good finds home.</p></div><form className="checkout-layout" onSubmit={placeOrder}><div className="checkout-form"><section className="checkout-section"><div className="checkout-section-title"><span>01</span><div><h2>Your details</h2><p>Where should we send your order?</p></div></div><div className="form-grid"><label>Full name<input name="name" defaultValue={user?.name || ''} autoComplete="name" required minLength="2" placeholder="Your full name" /></label><label>Email address<input name="email" type="email" defaultValue={user?.email || ''} autoComplete="email" required placeholder="you@example.com" /></label><label>Mobile number<input name="phone" type="tel" autoComplete="tel" required pattern="[0-9]{10,15}" placeholder="10-digit phone number" /></label><label>PIN code<input name="pin" inputMode="numeric" autoComplete="postal-code" required pattern="[0-9]{6}" placeholder="6-digit PIN code" /></label><label className="span-two">Delivery address<textarea name="address" autoComplete="street-address" rows="3" required minLength="8" placeholder="House / flat, street, and area" /></label><label className="span-two">City<input name="city" autoComplete="address-level2" required placeholder="Your city" /></label></div><div className="gps-checkout"><div><strong><LocateFixed size={16} /> GPS delivery point</strong><p>Optionally save your current coordinates to help identify the delivery location.</p>{gpsLocation && <small>{gpsLocation.latitude.toFixed(5)}, {gpsLocation.longitude.toFixed(5)} · ±{Math.round(gpsLocation.accuracy)} m</small>}{gpsStatus && <small className={gpsLocation ? 'gps-success' : 'gps-error'} role="status">{gpsLocation && <Check size={13} />}{gpsStatus}</small>}</div><div className="gps-actions"><button type="button" className="button gps-button" onClick={useCurrentLocation} disabled={locating}>{locating ? 'Locating…' : gpsLocation ? 'Refresh GPS' : 'Use my location'}</button>{gpsLocation && <button type="button" className="gps-clear" onClick={() => { setGpsLocation(null); setGpsStatus('GPS location removed.') }}>Remove</button>}</div></div></section><section className="checkout-section"><div className="checkout-section-title"><span>02</span><div><h2>Payment, your way</h2><p>Choose how you’d like to complete this demo order.</p></div></div><div className="payment-options"><label className={`payment-option ${payment === 'cod' ? 'selected' : ''}`}><input type="radio" name="paymentChoice" value="cod" checked={payment === 'cod'} onChange={() => setPayment('cod')} /><span className="payment-icon"><PackageCheck size={19} /></span><span><b>Cash on Delivery</b><small>Pay when your order arrives</small></span><i /></label><label className={`payment-option ${payment === 'online' ? 'selected' : ''}`}><input type="radio" name="paymentChoice" value="online" checked={payment === 'online'} onChange={() => setPayment('online')} /><span className="payment-icon"><CreditCard size={19} /></span><span><b>Demo Online Payment</b><small>No real payment will be collected</small></span><i /></label></div></section></div><aside className="order-summary checkout-summary"><h2>Your good finds</h2><div className="checkout-items">{cart.map((item) => <div key={item.id} className="checkout-item"><img src={item.image} alt="" /><span><b>{item.name}</b><small>Qty {item.quantity}</small></span><strong>{formatPrice(item.price * item.quantity)}</strong></div>)}</div><div className="summary-line"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>{bundleDiscount > 0 && <div className="summary-line bundle-discount-line"><span>Bundle savings</span><span>−{formatPrice(bundleDiscount)}</span></div>}<div className="summary-line"><span>Delivery</span><span>{delivery ? formatPrice(delivery) : 'On us'}</span></div><div className="summary-line summary-total"><strong>Total</strong><strong>{formatPrice(subtotal + delivery - bundleDiscount)}</strong></div><button type="submit" className="button button-primary checkout-button">Place my order <ArrowRight size={17} /></button><span className="secure-note"><MapPin size={14} /> Order data is used for delivery only</span></aside></form></div></main>
}