import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="font-display text-2xl">Página não encontrada</h1>
      <Link href="/" className="btn-primary mt-6">Voltar à Minha Torre</Link>
    </div>
  );
}
