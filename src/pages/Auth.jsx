import { ArrowRight, LockKeyhole, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api.js'
import { useShop } from '../context/ShopContext.jsx'

export default function Auth({ mode = 'login', adminOnly = false }) {
  const isRegister = mode === 'register'
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { setUser, brand } = useShop()
  const navigate = useNavigate()
  const location = useLocation()
  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email')).trim()
    const password = String(form.get('password'))
    const name = isRegister ? String(form.get('name')).trim() : email.split('@')[0]
    if (password.length < 6) { setError('Your password needs at least 6 characters.'); return }
    if (isRegister && name.length < 2) { setError('Please enter your name.'); return }
    setSubmitting(true)
    try {
      const { user } = await apiRequest(adminOnly ? '/admin/login' : `/auth/${isRegister ? 'register' : 'login'}`, {
        method: 'POST',
        body: { name, email, password },
      })
      setUser(user)
      navigate(location.state?.from || (adminOnly || user.role === 'admin' ? '/admin' : '/'), { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }
  return <main className="auth-page"><div className="auth-image"><img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1300&q=85" alt="Friends enjoying a day of shopping" /><div><span>THE GOOD THINGS</span><strong>are closer<br />than you think.</strong></div></div><div className="auth-panel"><div className="auth-form-wrap"><span className="eyebrow">{adminOnly ? 'ADMINISTRATOR ACCESS' : isRegister ? 'COME ON IN' : 'GOOD TO SEE YOU'}</span><h1>{adminOnly ? 'Sign in to your store.' : isRegister ? 'Make yourself at home.' : 'Welcome back.'}</h1><p>{adminOnly ? 'Use the email and password for your administrator account.' : isRegister ? 'A little account makes finding your favorites easier.' : 'Your good finds are right where you left them.'}</p><form onSubmit={onSubmit} className="form-stack">{isRegister && <label>Your name<span className="input-wrap"><UserRound size={17} /><input type="text" name="name" placeholder="How should we call you?" autoComplete="name" required minLength="2" /></span></label>}<label>Email address<span className="input-wrap"><UserRound size={17} /><input type="email" name="email" placeholder="you@example.com" autoComplete="email" required /></span></label><label>Password<span className="input-wrap"><LockKeyhole size={17} /><input type="password" name="password" placeholder="At least 6 characters" autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength="6" /></span></label>{error && <span className="form-error" role="alert">{error}</span>}<button className="button button-primary auth-submit" type="submit" disabled={submitting}>{submitting ? 'One moment…' : adminOnly ? 'Admin sign in' : isRegister ? 'Create your account' : 'Sign in'} <ArrowRight size={17} /></button></form><div className="demo-note"><LockKeyhole size={15} /><span>Your account is stored on the local {brand.name} server for this demo.</span></div>{adminOnly ? <p className="auth-switch">Setting up the first administrator? <Link to="/admin/setup">Create admin account</Link></p> : <p className="auth-switch">{isRegister ? 'Already have a little account?' : 'New around here?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>}</div></div></main>
}