import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-10 flex flex-col items-center gap-2 text-center">
        <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)]">
          Sign in
        </h1>
        <p className="text-xs uppercase tracking-widest text-[var(--text-tertiary)]">
          Investor Portal
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
