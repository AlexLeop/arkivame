import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Unauthorized',
};

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Acesso Não Autorizado</h1>
      <p className="mt-4 text-lg text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      <p className="mt-2 text-base text-muted-foreground">Por favor, verifique suas credenciais ou entre em contato com o administrador.</p>
      <div className="mt-6">
        <Link
          href="/login"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Voltar para o Login
        </Link>
      </div>
    </div>
  );
}