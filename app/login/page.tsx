"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro("");

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      router.replace("/admin");
    } catch (err: any) {
      const mensagem =
        err.code === "auth/user-not-found" || err.code === "auth/invalid-credential"
          ? "Email ou senha inválidos."
          : err.code === "auth/invalid-email"
          ? "Email inválido."
          : "Erro ao fazer login. Tente novamente.";
      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 p-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-6"
      >
        <h1 className="text-2xl font-bold text-center text-zinc-800">
          Acesso Administrativo
        </h1>

        {erro && (
          <div className="bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg p-3 text-center">
            {erro}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-600">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="seu@email.com"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-600">Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={carregando}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold rounded-lg transition-colors"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
