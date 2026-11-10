import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import express from 'express'
import { categories, products } from '../src/data/products.js'

const scrypt = promisify(scryptCallback)
const app = express()
const port = Number(process.env.PORT) || 4000
const serverDirectory = dirname(fileURLToPath(import.meta.url))
const storePath = join(serverDirectory, 'data', 'store.json')
const sessions = new Map()
let writeQueue = Promise.resolve()

const emptyStore = () => ({ users: [], carts: {}, wishlists: {}, orders: [] })

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
  return { id: user.id, name: user.name, email: user.email }
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
    const product = products.find((entry) => entry.id === item?.id)
    const quantity = Math.min(maximumQuantity, Math.max(1, Math.floor(Number(item?.quantity) || 1)))
    if (product) normalized.set(product.id, Math.min(maximumQuantity, (normalized.get(product.id) || 0) + quantity))
  }
  return [...normalized].map(([id, quantity]) => ({ id, quantity }))
}

function cartWithProducts(items = []) {
  return items.flatMap(({ id, quantity }) => {
    const product = products.find((entry) => entry.id === id)
    return product ? [{ ...product, quantity }] : []
  })
}

function wishlistWithProducts(ids = []) {
  return ids.map((id) => products.find((product) => product.id === id)).filter(Boolean)
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
app.get('/api/products', (request, response) => response.json({ products }))
app.get('/api/categories', (request, response) => response.json({ categories }))
app.get('/api/auth/me', (request, response) => response.json({ user: request.user || null }))

app.post('/api/auth/register', async (request, response) => {
  const name = String(request.body?.name || '').trim()
  const email = String(request.body?.email || '').trim().toLowerCase()
  const password = String(request.body?.password || '')
  if (name.length < 2) return response.status(400).json({ error: 'Please enter a name with at least 2 characters.' })
  if (!/^\S+@\S+\.\S+$/.test(email)) return response.status(400).json({ error: 'Please enter a valid email address.' })
  if (password.length < 6) return response.status(400).json({ error: 'Your password needs at least 6 characters.' })

  const salt = randomBytes(16).toString('hex')
  const passwordHash = Buffer.from(await scrypt(password, salt, 64)).toString('hex')
  const user = { id: randomUUID(), name, email, salt, passwordHash }
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

app.post('/api/auth/login', async (request, response) => {
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

  const sessionId = randomBytes(32).toString('base64url')
  sessions.set(sessionId, { userId: user.id, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  setSessionCookie(response, sessionId)
  response.json({ user: publicUser(user) })
})

app.post('/api/auth/logout', (request, response) => {
  const sessionId = parseCookies(request.headers.cookie).shopease_session
  if (sessionId) sessions.delete(sessionId)
  clearSessionCookie(response)
  response.json({ ok: true })
})

app.post('/api/account/sync', requireUser, async (request, response) => {
  const guestCart = normalizeItems(request.body?.cart)
  const guestWishlist = (request.body?.wishlist || []).map((product) => product?.id).filter((id) => products.some((product) => product.id === id))
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
  const wishlist = [...new Set((request.body?.wishlist || []).map((product) => product?.id).filter((id) => products.some((product) => product.id === id)))]
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

  const items = normalizeItems(request.body?.items)
  if (!items.length) return response.status(400).json({ error: 'Your bag is empty.' })
  const orderItems = cartWithProducts(items)
  const subtotal = orderItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const delivery = subtotal >= 2999 ? 0 : 99
  const order = {
    number: `SE${Date.now().toString().slice(-8)}${randomBytes(2).toString('hex').toUpperCase()}`,
    userId: request.user?.id || null,
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    phone: String(phone).trim(),
    pin: String(pin).trim(),
    address: String(address).trim(),
    city: String(city).trim(),
    payment,
    items: orderItems,
    subtotal,
    delivery,
    total: subtotal + delivery,
    createdAt: new Date().toISOString(),
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

app.listen(port, '127.0.0.1', () => {
  console.log(`ZORVIQUE API listening on http://127.0.0.1:${port}`)
})