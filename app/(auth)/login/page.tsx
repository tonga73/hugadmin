import { LoginButton, Logo } from "@/components/shared";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 h-full">
      <div className="space-y-3">
        <Logo />
        <p className="text-sm text-center font-light tracking-wider uppercase">
          Sistema de control de expedientes
        </p>
      </div>
      <LoginButton />
    </div>
  );
}
