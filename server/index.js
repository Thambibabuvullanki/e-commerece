import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import express from 'express'
import { categories, products as seedProducts } from '../src/data/products.js'

const scrypt = promisify(scryptCallback)
const app = express()
const port = Number(process.env.PORT) || 4001
const serverDirectory = dirname(fileURLToPath(import.meta.url))
const storePath = join(serverDirectory, 'data', 'store.json')
const sessions = new Map()
let writeQueue = Promise.resolve()
let catalogProducts = [...seedProducts]
let storefrontBrand = { name: 'ZORVIQUE', tagline: 'Everything You Love, All in One Place.', logoUrl: '' }

const emptyStore = () => ({ users: [], carts: {}, wishlists: {}, orders: [], restockAlerts: [], products: [...seedProducts], brand: storefrontBrand })

async function readStore() {
  try {
    return JSON.parse(await readFile(storePath, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return emptyStore()
    throw error
  }
}

function updateStore(update) {
  const result = writeQueue.then(async () => {
    const store = await readStore()
    const value = update(store)
    const temporaryPath = `${storePath}.${process.pid}.tmp`
    await writeFile(temporaryPath, JSON.stringify(store, null, 2))
    await rename(temporaryPath, storePath)
    return value
  })
  writeQueue = result.then(() => undefined, () => undefined)
  return result
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role || 'customer' }
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((part) => {
    const separator = part.indexOf('=')
    if (separator < 0) return ['', '']
    return [part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim())]
  }).filter(([key]) => key))
}

function setSessionCookie(response, sessionId) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader('Set-Cookie', `shopease_session=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secure}`)
}

function clearSessionCookie(response) {
  response.setHeader('Set-Cookie', 'shopease_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0')
}

function normalizeItems(items, maximumQuantity = 99) {
  if (!Array.isArray(items)) return []
  const normalized = new Map()
  for (const item of items) {
    const product = catalogProducts.find((entry) => entry.id === item?.id)
    const quantity = Math.min(maximumQuantity, Math.max(1, Math.floor(Number(item?.quantity) || 1)))
    if (product) normalized.set(product.id, Math.min(maximumQuantity, (normalized.get(product.id) || 0) + quantity))
  }
  return [...normalized].map(([id, quantity]) => ({ id, quantity }))
}

function cartWithProducts(items = []) {
  return items.flatMap(({ id, quantity }) => {
    const product = catalogProducts.find((entry) => entry.id === id)
    return product ? [{ ...product, quantity }] : []
  })
}

function wishlistWithProducts(ids = []) {
  return ids.map((id) => catalogProducts.find((product) => product.id === id)).filter(Boolean)
}

function accountState(store, userId) {
  return {
    cart: cartWithProducts(store.carts[userId] || []),
    wishlist: wishlistWithProducts(store.wishlists[userId] || []),
  }
}

function requireUser(request, response, next) {
  if (!request.user) return response.status(401).json({ error: 'Please sign in to continue.' })
  next()
}

function requireAdmin(request, response, next) {
  if (!request.user) return response.status(401).json({ error: 'Please sign in to continue.' })
  if (request.user.role !== 'admin') return response.status(403).json({ error: 'Administrator access is required.' })
  next()
}

function validateProduct(input, id) {
  const name = String(input?.name || '').trim()
  const category = String(input?.category || '').trim()
  const image = String(input?.image || '').trim()
  const description = String(input?.description || '').trim()
  const price = Number(input?.price)
  const originalPrice = Number(input?.originalPrice)
  const rating = Number(input?.rating ?? 0)
  const reviews = Number(input?.reviews ?? 0)
  if (!name || name.length > 120) throw new Error('Product name is required and must be under 120 characters.')
  if (!category || category.length > 60) throw new Error('Product category is required and must be under 60 characters.')
  if (!image || image.length > 1000) throw new Error('A product image URL is required.')
  try {
    if (!['http:', 'https:'].includes(new URL(image).protocol)) throw new Error()
  } catch {
    throw new Error('Product image must be an http or https URL.')
  }
  if (!description || description.length > 2000) throw new Error('Product description is required and must be under 2,000 characters.')
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(originalPrice) || originalPrice < price) throw new Error('Enter valid prices; the original price must be at least the selling price.')
  if (!Number.isFinite(rating) || rating < 0 || rating > 5 || !Number.isInteger(reviews) || reviews < 0) throw new Error('Rating must be between 0 and 5, and reviews must be a non-negative whole number.')
  return {
    id,
    name,
    category,
    image,
    description,
    price: Math.round(price),
    originalPrice: Math.round(originalPrice),
    rating,
    reviews,
    tag: String(input?.tag || '').trim().slice(0, 40),
    brand: String(input?.brand || '').trim().slice(0, 60),
    onSale: Boolean(input?.onSale),
    inStock: input?.inStock !== false,
  }
}

app.use(express.json({ limit: '100kb' }))
app.use(async (request, response, next) => {
  try {
    const sessionId = parseCookies(request.headers.cookie).shopease_session
    const session = sessions.get(sessionId)
    if (session && session.expiresAt > Date.now()) {
      const store = await readStore()
      const user = store.users.find((entry) => entry.id === session.userId)
      if (user) request.user = publicUser(user)
      else sessions.delete(sessionId)
    } else if (sessionId) {
      sessions.delete(sessionId)
    }
    next()
  } catch (error) {
    next(error)
  }
})

app.get('/api/health', (request, response) => response.json({ status: 'ok' }))
app.get('/api/products', (request, response) => response.json({ products: catalogProducts }))
app.get('/api/categories', (request, response) => {
  const knownCategories = new Set(categories.map((category) => category.name))
  const addedCategories = [...new Set(catalogProducts.map((product) => product.category))]
    .filter((name) => !knownCategories.has(name))
    .map((name) => ({
      name,
      image: catalogProducts.find((product) => product.category === name)?.image || '',
      count: 'More to love',
    }))
  response.json({ categories: [...categories, ...addedCategories] })
})
app.get('/api/storefront', (request, response) => response.json({ brand: storefrontBrand }))
app.get('/api/auth/me', (request, response) => response.json({ user: request.user || null }))
app.get('/api/admin/setup-status', async (request, response) => {
  const store = await readStore()
  response.json({ setupRequired: !store.users.some((user) => user.role === 'admin') })
})

app.post('/api/admin/setup', async (request, response) => {
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress)) {
    return response.status(403).json({ error: 'Initial administrator setup is only available on this computer.' })
  }
  const name = String(request.body?.name || '').trim()
  const email = String(request.body?.email || '').trim().toLowerCase()
  const password = String(request.body?.password || '')
  if (name.length < 2 || name.length > 80) return response.status(400).json({ error: 'Enter a name between 2 and 80 characters.' })
  if (!/^\S+@\S+\.\S+$/.test(email)) return response.status(400).json({ error: 'Please enter a valid email address.' })
  if (password.length < 10) return response.status(400).json({ error: 'Choose a unique password with at least 10 characters.' })
  const salt = randomBytes(16).toString('hex')
  const passwordHash = Buffer.from(await scrypt(password, salt, 64)).toString('hex')
  const user = { id: randomUUID(), name, email, salt, passwordHash, role: 'admin' }
  let adminUser = user
  try {
    await updateStore((store) => {
      if (store.users.some((entry) => entry.role === 'admin')) {
        const error = new Error('An administrator has already been set up.')
        error.status = 409
        throw error
      }
      const existingUser = store.users.find((entry) => entry.email === email)
      if (existingUser) {
        Object.assign(existingUser, { ...user, id: existingUser.id })
        adminUser = existingUser
      }
      else store.users.push(user)
    })
    const sessionId = randomBytes(32).toString('base64url')
    sessions.set(sessionId, { userId: adminUser.id, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 })
    setSessionCookie(response, sessionId)
    response.status(201).json({ user: publicUser(adminUser) })
  } catch (error) {
    if (error.status) return response.status(error.status).json({ error: error.message })
    throw error
  }
})

app.get('/api/admin/products', requireAdmin, (request, response) => response.json({ products: catalogProducts }))
app.post('/api/admin/products', requireAdmin, async (request, response) => {
  let product
  try {
    product = validateProduct(request.body, randomUUID())
  } catch (error) {
    return response.status(400).json({ error: error.message })
  }
  await updateStore((store) => {
    store.products ||= [...seedProducts]
    store.products.push(product)
    catalogProducts = store.products
  })
  response.status(201).json({ product })
})

app.put('/api/admin/products/:id', requireAdmin, async (request, response) => {
  const existing = catalogProducts.find((product) => product.id === request.params.id)
  if (!existing) return response.status(404).json({ error: 'That product could not be found.' })
  let product
  try {
    product = validateProduct({ ...existing, ...request.body }, existing.id)
  } catch (error) {
    return response.status(400).json({ error: error.message })
  }
  await updateStore((store) => {
    store.products ||= [...seedProducts]
    store.products = store.products.map((item) => item.id === product.id ? product : item)
    catalogProducts = store.products
  })
  response.json({ product })
})

app.delete('/api/admin/products/:id', requireAdmin, async (request, response) => {
  if (!catalogProducts.some((product) => product.id === request.params.id)) {
    return response.status(404).json({ error: 'That product could not be found.' })
  }
  await updateStore((store) => {
    store.products ||= [...seedProducts]
    store.products = store.products.filter((product) => product.id !== request.params.id)
    for (const [userId, items] of Object.entries(store.carts)) {
      store.carts[userId] = items.filter((item) => item.id !== request.params.id)
    }
    for (const [userId, ids] of Object.entries(store.wishlists)) {
      store.wishlists[userId] = ids.filter((id) => id !== request.params.id)
    }
    catalogProducts = store.products
  })
  response.json({ ok: true })
})

app.put('/api/admin/brand', requireAdmin, async (request, response) => {
  const name = String(request.body?.name || '').trim()
  const tagline = String(request.body?.tagline || '').trim()
  const logoUrl = String(request.body?.logoUrl || '').trim()
  if (!name || name.length > 60) return response.status(400).json({ error: 'Store name is required and must be under 60 characters.' })
  if (tagline.length > 120) return response.status(400).json({ error: 'Tagline must be under 120 characters.' })
  if (logoUrl.length > 1000 || (logoUrl && !/^https?:\/\/\S+$/i.test(logoUrl))) {
    return response.status(400).json({ error: 'Logo must be an image URL starting with http:// or https://.' })
  }
  const brand = { name, tagline, logoUrl }
  await updateStore((store) => {
    store.brand = brand
    storefrontBrand = brand
  })
  response.json({ brand })
})

app.post('/api/restock-alerts', async (request, response) => {
  const product = catalogProducts.find((entry) => entry.id === request.body?.productId)
  const email = String(request.body?.email || '').trim().toLowerCase()
  if (!product) return response.status(404).json({ error: 'That product could not be found.' })
  if (product.inStock !== false) return response.status(400).json({ error: 'This product is currently in stock.' })
  if (!/^\S+@\S+\.\S+$/.test(email)) return response.status(400).json({ error: 'Please enter a valid email address.' })
  await updateStore((store) => {
    store.restockAlerts ||= []
    if (!store.restockAlerts.some((alert) => alert.productId === product.id && alert.email === email)) {
      store.restockAlerts.push({ productId: product.id, email, createdAt: new Date().toISOString() })
    }
  })
  response.status(201).json({ ok: true, notificationConfigured: false })
})

app.post('/api/auth/register', async (request, response) => {
  const name = String(request.body?.name || '').trim()
  const email = String(request.body?.email || '').trim().toLowerCase()
  const password = String(request.body?.password || '')
  if (name.length < 2) return response.status(400).json({ error: 'Please enter a name with at least 2 characters.' })
  if (!/^\S+@\S+\.\S+$/.test(email)) return response.status(400).json({ error: 'Please enter a valid email address.' })
  if (password.length < 6) return response.status(400).json({ error: 'Your password needs at least 6 characters.' })

  const salt = randomBytes(16).toString('hex')
  const passwordHash = Buffer.from(await scrypt(password, salt, 64)).toString('hex')
  const user = { id: randomUUID(), name, email, salt, passwordHash, role: 'customer' }
  try {
    await updateStore((store) => {
      if (store.users.some((entry) => entry.email === email)) {
        const error = new Error('An account with this email already exists.')
        error.status = 409
        throw error
      }
      store.users.push(user)
    })
    const sessionId = randomBytes(32).toString('base64url')
    sessions.set(sessionId, { userId: user.id, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 })
    setSessionCookie(response, sessionId)
    response.status(201).json({ user: publicUser(user) })
  } catch (error) {
    if (error.status) return response.status(error.status).json({ error: error.message })
    throw error
  }
})

async function login(request, response, adminOnly = false) {
  const email = String(request.body?.email || '').trim().toLowerCase()
  const password = String(request.body?.password || '')
  const store = await readStore()
  const user = store.users.find((entry) => entry.email === email)
  if (!user) return response.status(401).json({ error: 'Email or password is incorrect.' })

  const passwordHash = Buffer.from(await scrypt(password, user.salt, 64))
  const expectedHash = Buffer.from(user.passwordHash, 'hex')
  if (passwordHash.length !== expectedHash.length || !timingSafeEqual(passwordHash, expectedHash)) {
    return response.status(401).json({ error: 'Email or password is incorrect.' })
  }
  if (adminOnly && user.role !== 'admin') {
    return response.status(403).json({ error: 'This account does not have administrator access. Use the first-time admin setup if no administrator has been created yet.' })
  }

  const sessionId = randomBytes(32).toString('base64url')
  sessions.set(sessionId, { userId: user.id, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  setSessionCookie(response, sessionId)
  response.json({ user: publicUser(user) })
}

app.post('/api/auth/login', (request, response) => login(request, response))
app.post('/api/admin/login', (request, response) => login(request, response, true))

app.post('/api/auth/logout', (request, response) => {
  const sessionId = parseCookies(request.headers.cookie).shopease_session
  if (sessionId) sessions.delete(sessionId)
  clearSessionCookie(response)
  response.json({ ok: true })
})

app.post('/api/account/sync', requireUser, async (request, response) => {
  const guestCart = normalizeItems(request.body?.cart)
  const guestWishlist = (request.body?.wishlist || []).map((product) => product?.id).filter((id) => catalogProducts.some((product) => product.id === id))
  const state = await updateStore((store) => {
    const existingCart = new Map((store.carts[request.user.id] || []).map((item) => [item.id, item.quantity]))
    for (const item of guestCart) existingCart.set(item.id, Math.min(99, (existingCart.get(item.id) || 0) + item.quantity))
    store.carts[request.user.id] = [...existingCart].map(([id, quantity]) => ({ id, quantity }))
    store.wishlists[request.user.id] = [...new Set([...(store.wishlists[request.user.id] || []), ...guestWishlist])]
    return accountState(store, request.user.id)
  })
  response.json(state)
})

app.get('/api/account/state', requireUser, async (request, response) => {
  const store = await readStore()
  response.json(accountState(store, request.user.id))
})

app.put('/api/account/state', requireUser, async (request, response) => {
  const cart = normalizeItems(request.body?.cart)
  const wishlist = [...new Set((request.body?.wishlist || []).map((product) => product?.id).filter((id) => catalogProducts.some((product) => product.id === id)))]
  const state = await updateStore((store) => {
    store.carts[request.user.id] = cart
    store.wishlists[request.user.id] = wishlist
    return accountState(store, request.user.id)
  })
  response.json(state)
})

app.post('/api/orders', async (request, response) => {
  const { name, email, phone, pin, address, city, payment } = request.body || {}
  if (![name, email, phone, pin, address, city].every((value) => String(value || '').trim())) {
    return response.status(400).json({ error: 'Please complete every delivery detail.' })
  }
  if (!/^\S+@\S+\.\S+$/.test(String(email))) return response.status(400).json({ error: 'Please enter a valid email address.' })
  if (!/^\d{10,15}$/.test(String(phone))) return response.status(400).json({ error: 'Enter a phone number with 10 to 15 digits.' })
  if (!/^\d{6}$/.test(String(pin))) return response.status(400).json({ error: 'Enter a 6-digit PIN code.' })
  if (!['cod', 'online'].includes(payment)) return response.status(400).json({ error: 'Choose a supported payment option.' })

  let deliveryLocation = null
  if (request.body?.location != null) {
    const latitude = Number(request.body.location.latitude)
    const longitude = Number(request.body.location.longitude)
    const accuracy = Number(request.body.location.accuracy)
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return response.status(400).json({ error: 'The GPS delivery location is invalid. Please try again or remove it.' })
    }
    deliveryLocation = {
      latitude,
      longitude,
      accuracy: Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : null,
    }
  }

  const unavailableItem = Array.isArray(request.body?.items) && request.body.items.some((item) =>
    catalogProducts.some((product) => product.id === item?.id && product.inStock === false),
  )
  if (unavailableItem) return response.status(409).json({ error: 'Your bag includes an item that is currently out of stock. Remove it before placing the order.' })

  const items = normalizeItems(request.body?.items)
  if (!items.length) return response.status(400).json({ error: 'Your bag is empty.' })
  const orderItems = cartWithProducts(items)
  const subtotal = orderItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const delivery = subtotal >= 2999 ? 0 : 99
  const requestedBundleIds = request.body?.bundleProductIds
  let bundleProductIds = []
  let bundleDiscount = 0
  if (requestedBundleIds !== undefined) {
    if (!Array.isArray(requestedBundleIds) || requestedBundleIds.length !== 2 || new Set(requestedBundleIds).size !== 2) {
      return response.status(400).json({ error: 'The bundle selection is invalid.' })
    }
    const bundleItems = requestedBundleIds.map((id) => orderItems.find((item) => item.id === id && item.quantity >= 1))
    if (bundleItems.some((item) => !item)) return response.status(400).json({ error: 'Both bundle products must be in your bag.' })
    bundleProductIds = requestedBundleIds
    bundleDiscount = Math.round(bundleItems.reduce((total, item) => total + item.price, 0) * 0.1)
  }
  const createdAt = new Date()
  const estimatedDelivery = {
    from: new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    to: new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  }
  const order = {
    number: `SE${Date.now().toString().slice(-8)}${randomBytes(2).toString('hex').toUpperCase()}`,
    userId: request.user?.id || null,
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    phone: String(phone).trim(),
    pin: String(pin).trim(),
    address: String(address).trim(),
    city: String(city).trim(),
    deliveryLocation,
    payment,
    items: orderItems,
    subtotal,
    delivery,
    bundleProductIds,
    bundleDiscount,
    total: subtotal + delivery - bundleDiscount,
    status: 'confirmed',
    estimatedDelivery,
    createdAt: createdAt.toISOString(),
  }
  await updateStore((store) => {
    store.orders.push(order)
    if (request.user) store.carts[request.user.id] = []
  })
  response.status(201).json({ order })
})

app.use((error, request, response, next) => {
  console.error(error)
  if (response.headersSent) return next(error)
  response.status(500).json({ error: 'Something went wrong on the server.' })
})

await mkdir(dirname(storePath), { recursive: true })
try {
  await readFile(storePath)
} catch (error) {
  if (error.code !== 'ENOENT') throw error
  await writeFile(storePath, JSON.stringify(emptyStore(), null, 2))
}

const savedStore = await readStore()
catalogProducts = Array.isArray(savedStore.products) ? savedStore.products : [...seedProducts]
storefrontBrand = { ...storefrontBrand, ...(savedStore.brand || {}) }

app.listen(port, '127.0.0.1', () => {
  console.log(`ZORVIQUE API listening on http://127.0.0.1:${port}`)
})