import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function Login() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (user) return <Navigate to="/" replace />;

  const onSubmit = (data: FormData) => login.mutate(data, { onSuccess: () => navigate('/') });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.12),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.08),transparent_40%)]" />
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
            <GraduationCap className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Welcome back to ClassDesk</h1>
          <p className="mt-1 text-sm text-zinc-500">Sign in to manage your classes</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-card dark:border-zinc-800 dark:bg-zinc-900">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          New to ClassDesk?{' '}
          <Link to="/signup" className="font-medium text-brand-600 hover:text-brand-700">
            Create an account
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-zinc-400">
          Demo: admin@classdesk.app / Password123!
        </p>
      </div>
    </div>
  );
}
