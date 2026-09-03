import Link from "next/link";
import type { Corretor } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { obterCorretorAtual } from "@/lib/corretor-atual";
import { carregarClientesComResumo } from "@/lib/painel-dados";
import { paraEstudoFormulario } from "@/lib/estudo-formulario";
import { FatoresForm } from "@/components/painel/ajustes/FatoresForm";
import { HorariosForm } from "@/components/painel/ajustes/HorariosForm";
import { RetencaoInput, ExclusaoLgpdForm } from "@/components/painel/ajustes/LgpdInterativo";
import { PerfilMarcaForm } from "@/components/painel/ajustes/PerfilMarcaForm";

const ABAS = [
  { n: 1, nome: "Fatores de cálculo", sub: "o racional, editável", titulo: "Fatores de cálculo", sub2: "Os parâmetros do racional saem do código e ficam aqui. Estudos em aberto recalculam ao salvar; mapas gerados não mudam." },
  { n: 2, nome: "Horários sugeridos", sub: "o que o lead vê", titulo: "Horários sugeridos", sub2: "As três opções que a página do lead oferece, calculadas a partir do dia do preenchimento, e o campo aberto." },
  { n: 3, nome: "LGPD e retenção", sub: "consentimento e exclusão", titulo: "LGPD e retenção", sub2: "Onde o consentimento fica registrado, como um cliente sai do sistema, e a fila dos mapas parados." },
  { n: 4, nome: "Acesso e senha", sub: "login e recuperação", titulo: "Acesso e senha", sub2: "O caminho completo de recuperação de senha, e as regras do acesso enquanto há um corretor só." },
  { n: 5, nome: "Perfil e marca", sub: "nome, contato, logo e foto", titulo: "Perfil e marca", sub2: "O que identifica você nos materiais — nome, endereço, telefone, sua foto e o logo da corretora." },
] as const;

/**
 * Ajustes (Etapa 6 + Perfil e marca, 2026-09-03) — porta de Ajustes.dc.html, mais uma quinta aba
 * que não vem do protótipo original. Cinco abas via `?aba=1..5` (sem JS necessário pra trocar de
 * aba: são `<Link>`, cada aba recarrega os dados dela do zero).
 */
export default async function PaginaAjustes({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba: abaStr } = await searchParams;
  const aba = Number(abaStr) >= 1 && Number(abaStr) <= 5 ? Number(abaStr) : 1;
  const atual = ABAS[aba - 1];

  const corretor = await obterCorretorAtual();

  return (
    <div style={{ display: "flex", alignItems: "stretch", minHeight: "100%" }}>
      <div style={{ width: 250, flex: "none", boxSizing: "border-box", background: "#fff", borderRight: "1px solid var(--borda)", padding: "22px 18px" }}>
        <div style={{ font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--texto-terciario)" }}>Bloco 4</div>
        <div style={{ font: "600 18px var(--font-titulo)", color: "var(--marinho)", margin: "5px 0 6px" }}>Ajustes</div>
        <div style={{ font: "400 11.5px/1.6 var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 18 }}>
          O que muda o resultado sem mexer no código, e as obrigações que vêm com guardar dado de gente.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {ABAS.map((a) => {
            const on = a.n === aba;
            return (
              <Link
                key={a.n}
                href={`/painel/ajustes?aba=${a.n}`}
                style={{ display: "flex", gap: 11, padding: "11px 12px", borderRadius: 9, background: on ? "var(--azul-claro-fundo)" : "transparent", border: `1px solid ${on ? "var(--azul-claro-borda)" : "transparent"}` }}
              >
                <div style={{ width: 22, height: 22, borderRadius: "50%", flex: "none", display: "grid", placeItems: "center", font: "700 10.5px var(--font-interface)", color: "#fff", background: on ? "var(--azul)" : "var(--cinza-inativo)" }}>{a.n}</div>
                <div>
                  <div style={{ font: "600 12.5px var(--font-interface)", color: on ? "var(--marinho)" : "var(--texto)" }}>{a.nome}</div>
                  <div style={{ font: "400 11px/1.5 var(--font-interface)", color: "var(--texto-terciario)", marginTop: 2 }}>{a.sub}</div>
                </div>
              </Link>
            );
          })}
        </div>
        <Link href="/painel/dashboard" style={{ display: "block", font: "600 11.5px var(--font-interface)", color: "var(--azul)", marginTop: 18 }}>
          ← Painel do corretor
        </Link>
      </div>

      <div style={{ flex: 1, minWidth: 0, padding: "26px 32px 60px" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".09em", color: "var(--texto-terciario)" }}>Ajustes</div>
          <div style={{ font: "600 26px var(--font-titulo)", color: "var(--marinho)", margin: "5px 0 4px" }}>{atual.titulo}</div>
          <div style={{ font: "400 13px/1.6 var(--font-interface)", color: "var(--texto-secundario)", maxWidth: 660 }}>{atual.sub2}</div>
        </div>

        {aba === 1 && <AbaFatores corretorId={corretor.id} />}
        {aba === 2 && <AbaHorarios corretorId={corretor.id} corretor={corretor} />}
        {aba === 3 && <AbaLgpd corretorId={corretor.id} />}
        {aba === 4 && <AbaAcesso />}
        {aba === 5 && <AbaPerfil corretor={corretor} />}
      </div>
    </div>
  );
}

async function AbaFatores({ corretorId }: { corretorId: string }) {
  const [fatoresDb, estudosAbertos, contagemMapas] = await Promise.all([
    prisma.fatoresCalculo.findUniqueOrThrow({ where: { corretorId } }),
    prisma.estudo.findMany({ where: { corretorId, status: "aberto" }, orderBy: { atualizadoEm: "desc" }, include: { cliente: { select: { nome: true } } } }),
    prisma.mapa.count({ where: { corretorId } }),
  ]);
  const contagemEstudosAbertos = estudosAbertos.length;

  // Prefere um estudo que já tenha renda preenchida — um lead recém-chegado, sem nada respondido
  // ainda, sempre calcularia zero em tudo e a simulação não mostraria efeito nenhum. Cai pro mais
  // recente sem renda só se não houver nenhum melhor.
  const temRenda = (dados: unknown) => {
    const v = (dados as { vinculos?: Record<string, { renda?: number }> })?.vinculos;
    return !!v && Object.values(v).some((x) => (x?.renda ?? 0) > 0);
  };
  const estudoSimulacao = estudosAbertos.find((e) => temRenda(e.dados)) ?? estudosAbertos[0] ?? null;

  return (
    <FatoresForm
      fatoresIniciais={{
        pctCustoTransmissao: fatoresDb.pctCustoTransmissao,
        mesesVitalicia: fatoresDb.mesesVitalicia,
        prazoManutencaoAnos: fatoresDb.prazoManutencaoAnos,
        tetoMultiplicador: fatoresDb.tetoMultiplicador,
        prazoPensaoAnosPadrao: fatoresDb.prazoPensaoAnosPadrao,
        idadeIndependencia: fatoresDb.idadeIndependencia,
        fatorClt: fatoresDb.fatorClt,
        fatorServidor: fatoresDb.fatorServidor,
        fatorPensaoServidor: fatoresDb.fatorPensaoServidor,
        fatorAutonomo: fatoresDb.fatorAutonomo,
        anosInvalidez: fatoresDb.anosInvalidez,
        pctInvalidezDoenca: fatoresDb.pctInvalidezDoenca,
        pctRendaInvalidez: fatoresDb.pctRendaInvalidez,
        pctDit: fatoresDb.pctDit,
        fatorDoencasGraves: fatoresDb.fatorDoencasGraves,
      }}
      simulacao={estudoSimulacao ? { clienteNome: estudoSimulacao.cliente.nome, dados: paraEstudoFormulario(estudoSimulacao.dados) } : null}
      contagemEstudosAbertos={contagemEstudosAbertos}
      contagemMapas={contagemMapas}
    />
  );
}

async function AbaHorarios({ corretorId, corretor }: { corretorId: string; corretor: { ofereceCampoAberto: boolean; aceitaHorarioOcupado: boolean; pulaFimDeSemana: boolean } }) {
  const horarios = await prisma.horarioSugerido.findMany({ where: { corretorId }, orderBy: { ordem: "asc" } });
  return (
    <HorariosForm
      slotsIniciais={horarios.map((h) => ({ ordem: h.ordem, diaRelativo: h.diaRelativo, hora: h.hora, duracaoMin: h.duracaoMin }))}
      ofereceCampoAbertoInicial={corretor.ofereceCampoAberto}
      aceitaHorarioOcupadoInicial={corretor.aceitaHorarioOcupado}
      pulaFimDeSemanaInicial={corretor.pulaFimDeSemana}
    />
  );
}

async function AbaLgpd({ corretorId }: { corretorId: string }) {
  const [fatoresDb, clientes, resumo] = await Promise.all([
    prisma.fatoresCalculo.findUniqueOrThrow({ where: { corretorId } }),
    prisma.cliente.findMany({ where: { corretorId }, orderBy: { criadoEm: "desc" }, select: { id: true, nome: true, telefone: true, origem: true, lgpdAceitoEm: true, criadoEm: true, lgpdStatus: true } }),
    carregarClientesComResumo(corretorId),
  ]);

  const naFila = resumo
    .filter((r) => r.diasParado >= fatoresDb.diasRetencao && r.cliente.estagioFunil !== "fechado")
    .sort((a, b) => b.diasParado - a.diasParado);

  const regrasRetencao = [
    { icone: "✓", cor: "var(--verde-escuro)", texto: "O dashboard avisa e espera. Nenhuma exclusão automática." },
    { icone: "✓", cor: "var(--verde-escuro)", texto: "Cliente fechado não entra na contagem enquanto a apólice estiver ativa." },
    { icone: "→", cor: "var(--marinho)", texto: "Qualquer movimento no CRM — anotação, mudança de estágio, contato — zera o contador." },
    naFila.length === 0
      ? { icone: "✓", cor: "var(--verde-escuro)", texto: "Nada na fila hoje." }
      : { icone: "!", cor: "var(--alerta-texto)", texto: `Hoje há ${naFila.length} ${naFila.length === 1 ? "mapa" : "mapas"} na fila: ${naFila[0].cliente.nome}, ${naFila[0].diasParado} dias.` },
  ];

  const secoesPolitica = [
    { nome: "Quais dados são coletados", status: "escrito" },
    { nome: "Para que servem", status: "escrito" },
    { nome: "Com quem são compartilhados", status: "escrito" },
    { nome: "Por quanto tempo ficam guardados", status: "escrito" },
    { nome: "Como pedir a exclusão", status: "escrito" },
    { nome: "Revisão jurídica", status: "pendente" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <div>
              <div style={{ font: "600 16px var(--font-titulo)", color: "var(--marinho)" }}>Consentimentos registrados</div>
              <div style={{ font: "400 11.5px var(--font-interface)", color: "var(--texto-secundario)", marginTop: 2 }}>Cada aceite guarda a data, a origem e o texto que estava na tela.</div>
            </div>
            <a href="/painel/ajustes/exportar-consentimentos" style={{ font: "600 11.5px var(--font-interface)", color: "var(--azul)", cursor: "pointer" }}>exportar CSV</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxHeight: 420, overflowY: "auto" }}>
            {clientes.length === 0 && <div style={{ font: "400 12.5px var(--font-interface)", color: "var(--texto-terciario)", padding: "8px 0" }}>Nenhum cliente cadastrado ainda.</div>}
            {clientes.map((c) => {
              const cor = c.lgpdStatus === "aceito" ? "var(--verde-escuro)" : c.lgpdStatus === "verbal" ? "var(--nota-texto)" : "var(--alerta-texto)";
              const bg = c.lgpdStatus === "aceito" ? "var(--sucesso-fundo)" : c.lgpdStatus === "verbal" ? "var(--nota-fundo)" : "var(--alerta-fundo)";
              return (
                <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 100px 92px", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--fundo-alt)", alignItems: "center" }}>
                  <div style={{ font: "600 12.5px var(--font-interface)", color: "var(--texto)" }}>{c.nome}</div>
                  <div style={{ font: "400 11px var(--font-interface)", color: "var(--texto-terciario)" }}>{c.origem || "—"}</div>
                  <div style={{ font: "500 11.5px var(--font-interface)", color: "var(--texto-secundario)" }}>{(c.lgpdAceitoEm ?? c.criadoEm).toLocaleDateString("pt-BR")}</div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ font: "600 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".06em", color: cor, background: bg, padding: "4px 9px", borderRadius: 99 }}>{c.lgpdStatus}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "22px 24px" }}>
          <div style={{ font: "600 16px var(--font-titulo)", color: "var(--marinho)", marginBottom: 3 }}>Pedido de exclusão</div>
          <div style={{ font: "400 11.5px/1.6 var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 16 }}>
            Quando o cliente pede para sair, tudo dele vai embora — não é a mesma coisa que excluir um mapa.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div style={{ border: "1px solid var(--alerta-borda)", background: "var(--alerta-fundo)", borderRadius: 10, padding: "15px 17px" }}>
              <div style={{ font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--alerta-texto)", marginBottom: 9 }}>Excluir mapa</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["Sai o mapa e o estudo que o gerou.", "O cadastro do cliente permanece.", "Sem estudo, ele sai do funil e vira contato."].map((t) => (
                  <div key={t} style={{ font: "400 11.5px/1.6 var(--font-interface)", color: "var(--alerta-texto)" }}>{t}</div>
                ))}
              </div>
            </div>
            <div style={{ border: "1px solid var(--texto)", background: "#fff", borderRadius: 10, padding: "15px 17px" }}>
              <div style={{ font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--texto)", marginBottom: 9 }}>Excluir o cliente</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["Sai tudo: cadastro, estudos, mapas e histórico.", "Fica só o registro do pedido, com data — a prova de que você atendeu.", "Não tem volta e não passa pela fila dos 120 dias."].map((t) => (
                  <div key={t} style={{ font: "400 11.5px/1.6 var(--font-interface)", color: "var(--texto)" }}>{t}</div>
                ))}
              </div>
            </div>
          </div>
          <ExclusaoLgpdForm clientes={clientes.map((c) => ({ id: c.id, nome: c.nome, telefone: c.telefone }))} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "22px 24px" }}>
          <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 3 }}>Retenção · fila dos {fatoresDb.diasRetencao} dias</div>
          <div style={{ font: "400 11px/1.6 var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 14 }}>O aviso aparece no dashboard. A exclusão espera você.</div>
          <RetencaoInput diasIniciais={fatoresDb.diasRetencao} />
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {regrasRetencao.map((rr, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", font: "400 11.5px/1.65 var(--font-interface)", color: "var(--texto)" }}>
                <span style={{ color: rr.cor, fontWeight: 700, flex: "none" }}>{rr.icone}</span>
                {rr.texto}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "22px 24px" }}>
          <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 3 }}>Política de privacidade</div>
          <div style={{ font: "400 11px/1.6 var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 14 }}>Página pública, linkada no formulário do lead e no rodapé do e-mail.</div>
          <div style={{ background: "var(--fundo)", border: "1px solid var(--borda)", borderRadius: 9, padding: "11px 13px", font: "500 11.5px var(--font-interface)", color: "var(--marinho)", wordBreak: "break-all", marginBottom: 14 }}>
            setornorteseguros.com.br/privacidade
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {secoesPolitica.map((sp) => (
              <div key={sp.nome} style={{ display: "flex", justifyContent: "space-between", gap: 10, paddingBottom: 7, borderBottom: "1px dotted var(--borda)" }}>
                <span style={{ font: "500 11.5px var(--font-interface)", color: "var(--texto)" }}>{sp.nome}</span>
                <span style={{ font: "600 10.5px var(--font-interface)", color: sp.status === "escrito" ? "var(--verde-escuro)" : "var(--alerta-texto)", whiteSpace: "nowrap" }}>{sp.status}</span>
              </div>
            ))}
          </div>
          <div style={{ font: "400 11px/1.6 var(--font-interface)", color: "var(--texto-terciario)", marginTop: 12 }}>O texto final precisa de revisão jurídica antes de o link entrar no ar.</div>
        </div>
      </div>
    </div>
  );
}

function AbaAcesso() {
  const telasSenha = [
    { etapa: "Passo 1", icone: "?", iconeBg: "var(--azul-claro-fundo)", iconeCor: "var(--azul)", titulo: "Esqueceu a senha?", texto: "Informe o e-mail da sua conta. Enviamos um link para você criar uma senha nova.", campos: [{ rotulo: "E-mail", placeholder: "edgar@setornorteseguros.com.br" }], nota: null, botao: "Enviar o link", botaoBg: "var(--azul)", link: "Voltar para o login" },
    { etapa: "Passo 2", icone: "✉", iconeBg: "var(--sucesso-fundo)", iconeCor: "var(--verde-escuro)", titulo: "Link enviado", texto: "Enviamos para edgar@setornorteseguros.com.br. O link vale por 30 minutos e serve uma vez só.", campos: [], nota: "Não chegou? Confira o spam. Você pode pedir outro link em 60 segundos.", botao: "Reenviar em 60s", botaoBg: "var(--cinza-inativo)", link: "Trocar o e-mail" },
    { etapa: "Passo 3", icone: "🔒", iconeBg: "var(--azul-claro-fundo)", iconeCor: "var(--azul)", titulo: "Nova senha", texto: "Mínimo de 8 caracteres. Depois de salvar, as sessões abertas em outros aparelhos caem.", campos: [{ rotulo: "Nova senha", placeholder: "ao menos 8 caracteres" }, { rotulo: "Repetir a senha", placeholder: "a mesma senha" }], nota: "Você entra direto no painel depois de salvar.", botao: "Salvar e entrar", botaoBg: "var(--verde)", link: "Cancelar" },
  ];
  const regrasAcesso = [
    { rotulo: "Validade do link de recuperação", valor: "30 minutos" },
    { rotulo: "Usos do link", valor: "uma vez" },
    { rotulo: "Espera entre reenvios", valor: "60 segundos" },
    { rotulo: "Tamanho mínimo da senha", valor: "8 caracteres" },
    { rotulo: "Sessão expira em", valor: "30 dias sem uso" },
    { rotulo: "Corretores com acesso", valor: "1" },
  ];

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
      {telasSenha.map((ts) => (
        <div key={ts.etapa} style={{ width: 340, flex: "none" }}>
          <div style={{ font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".09em", color: "var(--texto-terciario)", marginBottom: 9 }}>{ts.etapa}</div>
          <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 14, padding: "26px 24px", minHeight: 330, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: ts.iconeBg, display: "grid", placeItems: "center", font: "700 17px var(--font-interface)", color: ts.iconeCor, marginBottom: 16 }}>{ts.icone}</div>
            <div style={{ font: "600 19px/1.3 var(--font-titulo)", color: "var(--marinho)", marginBottom: 8 }}>{ts.titulo}</div>
            <div style={{ font: "400 12px/1.7 var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 18 }}>{ts.texto}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {ts.campos.map((cm) => (
                <div key={cm.rotulo}>
                  <div style={{ font: "600 11px var(--font-interface)", color: "var(--marinho)", marginBottom: 5 }}>{cm.rotulo}</div>
                  <input type="text" disabled placeholder={cm.placeholder} style={{ width: "100%", padding: "11px 13px", border: "1.5px solid var(--borda)", borderRadius: 9, font: "500 12.5px var(--font-interface)", background: "var(--fundo)", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
            {ts.nota && <div style={{ background: "var(--fundo)", border: "1px solid var(--borda)", borderRadius: 9, padding: "12px 14px", font: "400 11.5px/1.65 var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 16 }}>{ts.nota}</div>}
            <div style={{ marginTop: "auto" }}>
              <div style={{ font: "700 12.5px var(--font-interface)", color: "#fff", background: ts.botaoBg, padding: 13, borderRadius: 999, textAlign: "center" }}>{ts.botao}</div>
              <div style={{ font: "600 11.5px var(--font-interface)", color: "var(--azul)", textAlign: "center", marginTop: 12 }}>{ts.link}</div>
            </div>
          </div>
        </div>
      ))}

      <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "22px 24px" }}>
          <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 14 }}>Regras do acesso</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {regrasAcesso.map((ra) => (
              <div key={ra.rotulo} style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 8, borderBottom: "1px dotted var(--borda)" }}>
                <span style={{ font: "500 12px var(--font-interface)", color: "var(--texto)" }}>{ra.rotulo}</span>
                <span style={{ font: "700 11.5px var(--font-interface)", color: "var(--marinho)", textAlign: "right", whiteSpace: "nowrap" }}>{ra.valor}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "var(--nota-fundo)", border: "1px solid var(--nota-borda)", borderRadius: 12, padding: "18px 20px", font: "400 11.5px/1.7 var(--font-interface)", color: "var(--nota-texto)" }}>
          Esta tela é referência — mostra como a recuperação de senha vai funcionar quando existir login de verdade. Hoje há um corretor só, sem senha nem sessão (ver AGENTS.md, &quot;Acesso e Identidade&quot; e o TODO em src/lib/corretor-atual.ts). Quando abrir para outros corretores, aqui também ganha o convite por e-mail e a lista de quem tem acesso.
        </div>
      </div>
    </div>
  );
}

function AbaPerfil({ corretor }: { corretor: Corretor }) {
  return (
    <PerfilMarcaForm
      perfilInicial={{
        nome: corretor.nome,
        cargo: corretor.cargo ?? "",
        corretora: corretor.corretora ?? "",
        susep: corretor.susep ?? "",
        whatsapp: corretor.whatsapp ?? "",
        emailContato: corretor.emailContato ?? "",
        endereco: corretor.endereco ?? "",
        razaoSocial: corretor.razaoSocial ?? "",
      }}
      fotoInicial={corretor.fotoUrl}
      logoClaroInicial={corretor.logoClaroUrl}
      logoEscuroInicial={corretor.logoEscuroUrl}
    />
  );
}
