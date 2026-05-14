import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-14">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1
          className="wordmark bg-gradient-to-b from-[var(--text-primary)] via-[var(--metal-light)] to-[var(--metal-mid)] bg-clip-text text-6xl font-light tracking-[0.28em] text-transparent sm:text-7xl"
          style={{ paddingRight: "0.28em" }}
        >
          AROMARIA
        </h1>

        <Ornament />

        <p className="font-serif text-base italic leading-relaxed text-[var(--metal-light)] sm:text-lg">
          On a path to excellence
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--text-tertiary)]">
            Investor Portal
          </p>
          <h2 className="font-serif text-2xl font-light tracking-tight text-[var(--text-primary)]">
            Sign in
          </h2>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

function Ornament() {
  return (
    <div className="flex w-48 items-center gap-3 text-[var(--metal-mid)]">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--metal-mid)]" />
      <span className="text-xs">&#9670;</span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--metal-mid)]" />
    </div>
  );
}
