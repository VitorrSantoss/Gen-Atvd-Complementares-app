import { api } from "../lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos compartilhados com a tela de Histórico de Submissões (mobile).
// Mantenha em sincronia com o HistoricoSubmissaoDTO do back-end.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Status possíveis de uma submissão (espelha o enum StatusSubmissao do back).
 */
export type StatusSubmissao = "PENDENTE" | "APROVADA" | "REPROVADA";

/**
 * Arquivo anexado à submissão, exibido na lista "Certificados anexados"
 * dentro do modal de detalhes.
 */
export interface CertificadoHistorico {
  id: number;
  nomeArquivo: string;
  urlArquivo: string;
}

/**
 * Item do histórico de submissões.
 *
 * Campos usados na tela:
 *  - identificacao/tipo  → título do card e do modal
 *  - dataSubmissao       → meta-info (formatada em pt-BR)
 *  - alunoNome/cursoNome → meta-info
 *  - status              → badge colorido e chave de filtro
 *  - historicoStatus     → linha do tempo de mudanças
 *  - quantidadeRegistros → total de certificados anexados
 *  - observacao          → feedback do coordenador (opcional)
 *  - certificados        → lista de arquivos anexados
 */
export interface HistoricoSubmissao {
  id: number;
  identificacao: string;
  tipo: string;
  dataSubmissao: string;
  alunoId: number;
  alunoNome: string;
  cursoNome: string;
  status: StatusSubmissao;
  historicoStatus: StatusSubmissao[];
  quantidadeRegistros: number;
  observacao?: string | null;
  certificados: CertificadoHistorico[];
}

/**
 * Serviço de Histórico de Submissões (mobile).
 *
 * ─── Endpoints consumidos ────────────────────────────────────────────────
 *  - GET /submissoes/historico        → lista (filtrada por usuário logado)
 *  - GET /submissoes/historico/{id}   → detalhe (com autorização no back)
 *
 * ─── Autenticação ────────────────────────────────────────────────────────
 * Usa o cliente `api` (axios) de `lib/api.ts`, que já injeta o JWT do
 * AsyncStorage no header Authorization a cada request. Nenhuma chamada
 * aqui precisa passar o token explicitamente.
 *
 * ─── Regra de negócio: isolamento por usuário ────────────────────────────
 * O filtro de "quem vê o quê" é responsabilidade do back-end:
 *   - ALUNO:        suas próprias submissões
 *   - COORDENADOR:  submissões dos cursos que coordena
 *   - SUPER_ADMIN:  todas
 */
export const historicoService = {
  /**
   * Lista as submissões visíveis ao usuário autenticado.
   * Chamada na carga inicial da tela e em pull-to-refresh.
   */
  async listar(): Promise<HistoricoSubmissao[]> {
    const { data } = await api.get<HistoricoSubmissao[]>("/submissoes/historico");
    return Array.isArray(data) ? data : [];
  },

  /**
   * Busca o detalhe de uma submissão pelo id.
   * O back-end retorna 403 se o usuário não tiver permissão.
   */
  async buscarPorId(id: number): Promise<HistoricoSubmissao> {
    const { data } = await api.get<HistoricoSubmissao>(
      `/submissoes/historico/${id}`,
    );
    return data;
  },
};
