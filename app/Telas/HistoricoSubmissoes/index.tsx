import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import SideDrawer from "../../../app/componentes/SideDrawer";
import { useCurrentUser } from "../../../app/hooks/useCurrentUser";
import { useDrawerNavigation } from "../../../app/hooks/userDrawerNavigation";
import {
  HistoricoSubmissao,
  StatusSubmissao,
  historicoService,
} from "../../../services/historicoService";
import { styles } from "./style";

// ─────────────────────────────────────────────────────────────────────────────
// Tela: Histórico de Submissões (mobile / perfil ALUNO)
//
// Objetivo:
//   Mostrar ao usuário autenticado a lista de submissões de atividades
//   complementares (próprias quando ALUNO, do curso quando COORDENADOR, todas
//   quando SUPER_ADMIN), com filtros por status e modal de detalhes com os
//   certificados anexados.
//
// Como chega aqui:
//   - Drawer lateral → item "Histórico" (SideDrawer)
//   - useDrawerNavigation mapeia a chave "historico" → /Telas/HistoricoSubmissoes
//     (ver app/hooks/userDrawerNavigation.ts)
//
// Fonte de dados:
//   - historicoService.listar() → GET /submissoes/historico
//   - JWT injetado automaticamente pelo interceptor de lib/api.ts
//   - Filtro por usuário/perfil é feito no back-end
// ─────────────────────────────────────────────────────────────────────────────

interface CertificadoDTO {
  id: number;
  nomeArquivo: string;
  urlArquivo: string;
}

/** Conjunto possível de filtros da barra superior. "TODAS" desliga o filtro. */
type Filtro = "TODAS" | StatusSubmissao;

const statusColors: Record<StatusSubmissao, { bg: string; color: string }> = {
  PENDENTE: { bg: "#FEF3C7", color: "#B45309" },
  APROVADA: { bg: "#DCFCE7", color: "#15803D" },
  REPROVADA: { bg: "#FEE2E2", color: "#B91C1C" },
};

const FILTROS: { key: Filtro; label: string }[] = [
  { key: "TODAS", label: "Todas" },
  { key: "PENDENTE", label: "Pendentes" },
  { key: "APROVADA", label: "Aprovadas" },
  { key: "REPROVADA", label: "Reprovadas" },
];

function formatarData(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const dia = String(date.getDate()).padStart(2, "0");
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const ano = date.getFullYear();
  const hora = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${ano} ${hora}:${min}`;
}

function StatusBadge({ status }: { status: StatusSubmissao }) {
  const c = statusColors[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.color }]}>{status}</Text>
    </View>
  );
}

export default function HistoricoSubmissoesScreen() {
  const insets = useSafeAreaInsets();

  // Usuário autenticado: alimenta o cabeçalho do drawer. Substitui o
  // `currentUser` hardcoded que existia antes (sempre "Vitor Shampo").
  const currentUser = useCurrentUser();

  const { drawerOpen, openDrawer, closeDrawer, handleSelect, handleLogout } =
    useDrawerNavigation("historico");

  // ─── Estado da tela ────────────────────────────────────────────────────
  // items:       lista bruta retornada pelo servidor (ordenada por data desc)
  // loading:     true na 1ª carga (spinner de tela cheia)
  // refreshing:  true durante pull-to-refresh (indicador no topo do FlatList)
  // error:       mensagem para o usuário em caso de falha
  // filtro:      filtro de status aplicado ao renderizar (sem nova requisição)
  // selecionada: submissão clicada — abre o Modal com detalhes
  const [items, setItems] = useState<HistoricoSubmissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("TODAS");
  const [selecionada, setSelecionada] = useState<HistoricoSubmissao | null>(
    null,
  );

  /**
   * Busca o histórico no back-end via historicoService (axios + JWT).
   *
   * @param showLoading se true, mostra spinner cheio de tela (carga inicial).
   *                    Em pull-to-refresh passamos false, pois o indicador é
   *                    o RefreshControl do FlatList.
   *
   * Em caso de erro, mostra o estado de erro real (com botão "Tentar
   * novamente"), sem MOCK_DATA — o usuário enxerga a verdade.
   */
  const carregar = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const data = await historicoService.listar();
      setItems(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.erro ??
        err?.response?.data?.message ??
        err?.message ??
        "Falha ao carregar histórico.";
      setError(typeof msg === "string" ? msg : "Erro desconhecido");
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Carga inicial ao montar a tela.
  useEffect(() => {
    carregar(true);
  }, [carregar]);

  /**
   * Pull-to-refresh: chamado ao puxar o FlatList para baixo.
   * Usa showLoading=false para NÃO esconder a lista durante a atualização.
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregar(false);
  }, [carregar]);

  /**
   * Aplica o filtro de status apenas na renderização — não refaz a requisição.
   * Recomputa só quando `items` ou `filtro` mudam.
   */
  const filtrados = useMemo(() => {
    if (filtro === "TODAS") return items;
    return items.filter((i) => i.status === filtro);
  }, [items, filtro]);

  const renderItem = ({ item }: { item: HistoricoSubmissao }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrapper}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.identificacao}
          </Text>
          <Text style={styles.cardSubtitle}>{item.tipo}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{formatarData(item.dataSubmissao)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="person-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{item.alunoNome ?? "—"}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="document-text-outline" size={14} color="#6B7280" />
          <Text style={styles.metaTextStrong}>
            {item.quantidadeRegistros}{" "}
            {item.quantidadeRegistros === 1 ? "registro" : "registros"}
          </Text>
        </View>
      </View>

      {item.observacao ? (
        <View style={styles.observacaoBox}>
          <Text style={styles.observacaoText}>{item.observacao}</Text>
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => setSelecionada(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="eye-outline" size={16} color="#4F46E5" />
          <Text style={styles.detailsButtonText}>Visualizar detalhes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * Conteúdo exibido quando a lista está vazia. Renderiza 3 cenários:
   *   - loading: spinner + texto "Carregando histórico..."
   *   - error:   ícone vermelho + botão "Tentar novamente"
   *   - vazio:   ícone neutro + mensagem "Nenhuma submissão por aqui"
   */
  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.stateText}>Carregando histórico...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.stateBox}>
          <Ionicons name="alert-circle-outline" size={42} color="#EF4444" />
          <Text style={styles.stateTitle}>Não foi possível carregar</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => carregar(true)}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.stateBox}>
        <Ionicons name="file-tray-outline" size={42} color="#9CA3AF" />
        <Text style={styles.stateTitle}>Nenhuma submissão por aqui</Text>
        <Text style={styles.stateText}>
          Quando você enviar uma atividade, ela aparecerá no histórico.
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={openDrawer}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Ionicons name="time-outline" size={18} color="#6366F1" />
          <Text style={styles.topBarTitle}>Histórico de Submissões</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24, flexGrow: 1 },
        ]}
        data={filtrados}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.pageTitle}>Meu Histórico</Text>
            <Text style={styles.pageSubtitle}>
              Acompanhe todas as suas submissões enviadas
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersRow}
            >
              {FILTROS.map((f) => {
                const active = f.key === filtro;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setFiltro(f.key)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        active && styles.chipLabelActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={renderEmpty}
      />

      <Modal
        visible={!!selecionada}
        transparent
        animationType="slide"
        onRequestClose={() => setSelecionada(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelecionada(null)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {selecionada?.identificacao}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelecionada(null)}
              >
                <Ionicons name="close" size={18} color="#374151" />
              </TouchableOpacity>
            </View>

            {selecionada && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tipo</Text>
                  <Text style={styles.detailValue}>{selecionada.tipo}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <StatusBadge status={selecionada.status} />
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Data/Hora</Text>
                  <Text style={styles.detailValue}>
                    {formatarData(selecionada.dataSubmissao)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Usuário</Text>
                  <Text style={styles.detailValue}>
                    {selecionada.alunoNome ?? "—"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Curso</Text>
                  <Text style={styles.detailValue}>
                    {selecionada.cursoNome ?? "—"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Registros processados</Text>
                  <Text style={styles.detailValue}>
                    {selecionada.quantidadeRegistros}
                  </Text>
                </View>
                {selecionada.observacao && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Observação</Text>
                    <Text style={styles.detailValue}>
                      {selecionada.observacao}
                    </Text>
                  </View>
                )}

                {selecionada.certificados &&
                  selecionada.certificados.length > 0 && (
                    <>
                      <Text style={styles.modalSectionTitle}>
                        Certificados anexados
                      </Text>
                      {selecionada.certificados.map((c: CertificadoDTO) => (
                        <View key={c.id} style={styles.certificadoItem}>
                          <Ionicons
                            name="document-attach-outline"
                            size={18}
                            color="#4F46E5"
                          />
                          <Text style={styles.certificadoName} numberOfLines={1}>
                            {c.nomeArquivo}
                          </Text>
                        </View>
                      ))}
                    </>
                  )}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <SideDrawer
        visible={drawerOpen}
        onClose={closeDrawer}
        user={currentUser}
        activeItem="historico"
        onSelect={handleSelect}
        onLogout={handleLogout}
      />
    </View>
  );
}
