import { LoginForm } from '../../../components/forms/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and password to access your account
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
