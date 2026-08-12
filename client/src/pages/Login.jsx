import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Leaf, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success('Logged in successfully');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-[22px] font-semibold text-text-main">Chirayath Vegetables</h1>
          <p className="text-sm text-text-muted mt-0.5">Dine with Nature</p>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-text-main mb-1">Welcome back</h2>
          <p className="text-sm text-text-muted mb-5">Sign in to manage your business ledger.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              placeholder="owner@chirayathvegetables.com"
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <Button type="submit" className="w-full" loading={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>

        <p className="text-xs text-text-muted text-center mt-5">
          Seed login: owner@chirayathvegetables.com / password123
        </p>
      </div>
    </div>
  );
}
