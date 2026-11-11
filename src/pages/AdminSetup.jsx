import { ArrowRight, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api.js'
import { useShop } from '../context/ShopContext.jsx'
import '../styles/admin.css'

export default function AdminSetup() {
  const { setUser } = useShop()
  const [setupRequired, setSetupRequired] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    apiRequest('/admin/setup-status')
      .then(({ setupRequired: required }) => setSetupRequired(required))
      .catch((requestError) => setError(requestError.message))
  }, [])

  if (setupRequired === false) return <Navigate to="/login" replace />
  if (setupRequired === null && !error) return <main className="page-shell"><div className="container"><p>Checking administrator setup…</p></div></main>

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const form = new FormData(event.currentTarget)
    try {
      const { user } = await apiRequest('/admin/setup', {
        method: 'POST',
        body: {
          name: String(form.get('name')).trim(),
          email: String(form.get('email')).trim(),
          password: String(form.get('password')),
        },
      })
      setUser(user)
      navigate('/admin', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
      setSubmitting(false)
    }
  }

  return <main className="page-shell admin-setup-page"><div className="container"><section className="admin-setup-card">
    <span className="admin-setup-icon"><ShieldCheck size={24} /></span>
    <span className="eyebrow">ONE-TIME LOCAL SETUP</span>
    <h1>Create your administrator account.</h1>
    <p>This creates the first store administrator on this computer. Choose a new, unique password; don’t reuse a password you’ve shared elsewhere.</p>
    <form className="form-stack" onSubmit={onSubmit}>
      <label>Your name<span className="input-wrap"><UserRound size={17} /><input name="name" autoComplete="name" required minLength="2" maxLength="80" placeholder="Store administrator" /></span></label>
      <label>Email address<span className="input-wrap"><UserRound size={17} /><input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></span></label>
      <label>New password<span className="input-wrap"><LockKeyhole size={17} /><input name="password" type="password" autoComplete="new-password" required minLength="10" placeholder="At least 10 characters" /></span></label>
      {error && <span className="form-error" role="alert">{error}</span>}
      <button className="button button-primary auth-submit" disabled={submitting}>{submitting ? 'Setting up…' : 'Create administrator account'} <ArrowRight size={17} /></button>
    </form>
    <small className="admin-setup-note">This setup page is only available until the first administrator is created.</small>
    <Link className="admin-setup-back" to="/">Back to storefront</Link>
  </section></div></main>
}
