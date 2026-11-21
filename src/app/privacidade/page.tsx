import Link from 'next/link';

/** Política de Privacidade — versão 2026-11. Revisar com assessoria jurídica antes da publicação. */
export default function Privacidade() {
  return (
    <article className="leitura mx-auto min-h-dvh max-w-2xl px-6 py-10 text-[16px]">
      <Link href="/" className="font-sans text-sm text-[#8C5C22] underline">← Voltar</Link>
      <h1 className="mt-6 font-display text-[30px] leading-tight">Política de Privacidade</h1>
      <p className="mt-1 font-sans text-[13px] text-[#6E6050]">Sentinelas da Estação · versão 2026-11</p>

      <div className="mt-6 space-y-5 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl">
        <p>
          O Sentinelas da Estação é um aplicativo devocional criado por Naiara de Medeiros. O que você registra aqui — pedidos
          de oração, diário, vigílias e estações — é íntimo. Esta política explica, de forma simples, como esses dados são tratados,
          conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
        </p>

        <h2>Quais dados coletamos</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Dados de conta: e-mail, senha (guardada de forma criptografada pelo provedor de autenticação) e o nome pelo qual deseja ser chamada, se informar.</li>
          <li>Conteúdo que você cria: pedidos de oração e seu histórico, testemunhos, registros do diário, vigílias, estações e preferências.</li>
          <li>Registros do seu aceite desta política e, no futuro, do consentimento para uso de inteligência artificial.</li>
        </ul>

        <h2>Para que usamos</h2>
        <p>Exclusivamente para fazer o aplicativo funcionar para você: guardar, sincronizar entre seus aparelhos e mostrar os seus registros.
          Não vendemos, não compartilhamos para publicidade e não usamos seu conteúdo para treinar inteligência artificial.</p>

        <h2>Quem pode ver</h2>
        <p>Somente você. Cada registro é protegido no banco de dados por regras que só permitem acesso à própria conta.
          Seus pedidos nunca aparecem em endereços públicos.</p>

        <h2>Onde os dados ficam</h2>
        <p>Os dados são armazenados com o provedor Supabase, em servidores localizados nos Estados Unidos, com criptografia em trânsito.
          Essa transferência internacional é necessária para a prestação do serviço.</p>

        <h2>Inteligência artificial</h2>
        <p>A assistente de oração é opcional. No modo local, nada sai do seu aparelho. A IA avançada, quando ativada, envia somente
          a mensagem e o contexto que você marcar ao provedor Anthropic para gerar a resposta, e apenas depois do seu consentimento
          expresso — que pode ser retirado a qualquer momento. Diário e testemunhos não são enviados. O histórico das conversas fica
          na sua conta e pode ser apagado por você. Seu conteúdo não é usado por este aplicativo para treinar modelos.</p>

        <h2>Seus direitos</h2>
        <p>Você pode, a qualquer momento, dentro do aplicativo em Configurações: exportar todos os seus dados e excluir sua conta —
          a exclusão apaga definitivamente todos os registros vinculados a ela. Também pode solicitar acesso, correção ou informações
          sobre o tratamento pelo contato abaixo.</p>

        <h2>Contato</h2>
        <p>Responsável: Naiara de Medeiros. E-mail para assuntos de privacidade: <strong>[a definir pela autora]</strong>.</p>
      </div>
    </article>
  );
}
