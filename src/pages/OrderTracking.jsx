import { ArrowLeft, LocateFixed, MapPin, PackageCheck, ShieldCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { formatPrice } from '../data/products.js'
import '../styles/order-tracking.css'

function readLastOrder() {
  try {
    return JSON.parse(sessionStorage.getItem('shopease-last-order'))
  } catch {
    return null
  }
}

function estimatedDeliveryRange(order) {
  const createdAt = new Date(order.createdAt || Date.now())
  const start = order.estimatedDelivery?.from ? new Date(order.estimatedDelivery.from) : new Date(createdAt.getTime() + 3 * 86400000)
  const end = order.estimatedDelivery?.to ? new Date(order.estimatedDelivery.to) : new Date(createdAt.getTime() + 5 * 86400000)
  const options = { day: 'numeric', month: 'short' }
  return `${start.toLocaleDateString('en-IN', options)} – ${end.toLocaleDateString('en-IN', options)}`
}

export default function OrderTracking() {
  const location = useLocation()
  const order = location.state?.order || readLastOrder()
  const [mapLoaded, setMapLoaded] = useState(false)
  const point = order?.deliveryLocation
  const hasCoordinates = Number.isFinite(point?.latitude) && Number.isFinite(point?.longitude)
  const mapUrl = hasCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${point.longitude - 0.008}%2C${point.latitude - 0.008}%2C${point.longitude + 0.008}%2C${point.latitude + 0.008}&layer=mapnik&marker=${point.latitude}%2C${point.longitude}`
    : ''
  const externalMapUrl = hasCoordinates
    ? `https://www.openstreetmap.org/?mlat=${point.latitude}&mlon=${point.longitude}#map=16/${point.latitude}/${point.longitude}`
    : ''
  const deliveryRange = estimatedDeliveryRange(order || {})
  const steps = [
    { status: 'pending', label: 'Awaiting confirmation' },
    { status: 'confirmed', label: 'Order confirmed' },
    { status: 'packed', label: 'Packed' },
    { status: 'shipped', label: 'On the way' },
    { status: 'delivered', label: 'Delivered' },
  ]
  const currentStatus = order?.status || 'confirmed'
  const currentStep = steps.findIndex((step) => step.status === currentStatus)

  if (!order) {
    return <main className="page-shell"><div className="container tracking-empty"><span className="eyebrow">ORDER TRACKING</span><h1>No recent order found.</h1><p>Place an order first, then you can view its delivery location here.</p><Link className="button button-primary" to="/shop">Explore the shop</Link></div></main>
  }

  return <main className="page-shell"><div className="container order-tracking"><Link className="back-link" to={location.state?.from || '/order-success'}><ArrowLeft size={15} /> {location.state?.from === '/admin' ? 'Back to orders' : 'Back to your order'}</Link><header className="tracking-heading"><span className="eyebrow">ORDER LOCATION</span><h1>Delivery destination</h1><p>Order <strong>{order.number}</strong> · {formatPrice(order.total)}</p></header><div className="tracking-layout"><section className="tracking-card tracking-map-card"><div className="tracking-card-heading"><span className="tracking-icon"><MapPin size={19} /></span><div><h2>{hasCoordinates ? 'GPS delivery point' : 'Delivery address'}</h2><p>{order.address}, {order.city} {order.pin}</p></div></div>{hasCoordinates ? <><div className="tracking-coordinates"><LocateFixed size={15} /><span>{point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}</span>{Number.isFinite(point.accuracy) && <small>±{Math.round(point.accuracy)} m</small>}</div>{mapLoaded ? <div className="tracking-map"><iframe title="Map of the GPS delivery point" src={mapUrl} loading="lazy" referrerPolicy="no-referrer" /><a href={externalMapUrl} target="_blank" rel="noreferrer">Open larger map</a></div> : <div className="map-placeholder"><MapPin size={28} /><strong>Your GPS location is saved</strong><span>Load an OpenStreetMap preview to see the pin on a map.</span><button className="button gps-button" onClick={() => setMapLoaded(true)}>Load map preview</button></div>}<small className="map-privacy"><ShieldCheck size={13} /> Loading the map shares these coordinates with OpenStreetMap.</small></> : <div className="map-placeholder map-no-gps"><PackageCheck size={27} /><strong>No GPS point was saved</strong><span>Your delivery address is still attached to this order. GPS can be added to a future order at checkout.</span></div>}</section><aside className="tracking-card tracking-status-card"><span className="tracking-status-icon"><PackageCheck size={21} /></span><span className="eyebrow">{currentStatus === 'cancelled' ? 'ORDER CANCELLED' : steps[Math.max(currentStep, 0)]?.label.toUpperCase()}</span><h2>Delivery progress</h2><strong className="eta-range">{currentStatus === 'cancelled' ? 'This order was cancelled' : deliveryRange}</strong><p>{currentStatus === 'pending' ? 'Your order is waiting for confirmation.' : currentStatus === 'cancelled' ? 'Please contact the store if you have questions about this order.' : 'Your order status is updated by the store. Delivery dates are estimates; carrier updates aren’t connected in this demo.'}</p><ol className="order-progress">{steps.map((step, index) => <li className={index === currentStep ? 'is-current' : index < currentStep && currentStatus !== 'cancelled' ? 'is-complete' : ''} key={step.status}><span>{index < currentStep ? <PackageCheck size={14} /> : index + 1}</span><div><strong>{step.label}</strong><small>{index === currentStep ? 'Current status' : index < currentStep ? 'Complete' : 'Awaiting update'}</small></div></li>)}</ol><div className="tracking-order-detail"><span>Order number</span><strong>{order.number}</strong></div><div className="tracking-order-detail"><span>Delivering to</span><strong>{order.name}</strong></div><Link className="tracking-shop-link" to="/shop">Continue shopping</Link></aside></div></div></main>
}
