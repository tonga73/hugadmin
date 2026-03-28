import { LoginButton, Logo } from "@/components/shared";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 h-full">
      <Logo />
      <LoginButton />
    </div>
  );
}
