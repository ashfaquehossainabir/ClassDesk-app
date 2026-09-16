import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { useSignup } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  role: z.enum(['student', 'tutor']),
});
type FormData = z.infer<typeof schema>;

export default function Signup() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const signup = useSignup();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { role: 'student' } });

  if (user) return <Navigate to="/" replace />;

  const onSubmit = (data: FormData) => signup.mutate(data, { onSuccess: () => navigate('/') });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.12),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.08),transparent_40%)]" />
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
            <GraduationCap className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Create your ClassDesk account</h1>
          <p className="mt-1 text-sm text-zinc-500">Book classes and track your progress</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-card dark:border-zinc-800 dark:bg-zinc-900">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Jane Doe" {...register('name')} />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="At least 8 characters" {...register('password')} />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <div>
              <Label htmlFor="role">I am a</Label>
              <select
                id="role"
                {...register('role')}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus-ring dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="student">Student / Parent</option>
                <option value="tutor">Tutor</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={signup.isPending}>
              {signup.isPending ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
