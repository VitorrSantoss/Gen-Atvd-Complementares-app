import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { styles } from "./style";

// ─────────────────────────────────────────────────────────────────────────────
// Componente: SideDrawer (Menu Lateral deslizante)
//
// Objetivo:
//   Renderizar o menu de navegação que desliza a partir da borda esquerda da
//   tela (padrão "hamburger menu"), por cima do conteúdo atual. Exibe os dados
//   do usuário logado, a lista de itens de navegação e o botão de sair.
//
// Como é usado:
//   <SideDrawer
//     visible={drawerOpen}
//     onClose={closeDrawer}
//     user={currentUser}
//     activeItem="dashboard"
//     onSelect={handleSelect}
//     onLogout={handleLogout}
//   />
//
// O componente é "controlado": quem decide se ele aparece é a tela pai, através
// da prop `visible`. Aqui dentro só cuidamos da animação e da renderização.
// ─────────────────────────────────────────────────────────────────────────────

// Largura da tela do dispositivo, obtida uma única vez no carregamento do módulo.
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// O drawer ocupa 80% da largura da tela, deixando 20% visível do conteúdo atrás.
const DRAWER_WIDTH = SCREEN_WIDTH * 0.8;

/**
 * Chaves possíveis de cada item do menu.
 * É um "union type": só esses 4 valores são aceitos, o que evita erros de
 * digitação ao referenciar uma rota (o TypeScript valida em tempo de compilação).
 */
export type MenuItemKey = "dashboard" | "submissao" | "regras" | "notificacoes";

/**
 * Formato de cada item do menu:
 *  - key:   identificador usado na navegação e para marcar o item ativo
 *  - label: texto exibido para o usuário
 *  - icon:  nome de um ícone válido do conjunto Ionicons (validado pelo tipo)
 */
interface MenuItem {
  key: MenuItemKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

/**
 * Lista fixa dos itens do menu, na ordem em que aparecem.
 * Para adicionar/remover uma opção, basta editar este array (e a MenuItemKey).
 é um array de objetos criado em TypeScript para estruturar os itens que vão aparecer no seu menu de navegação 
 */
const MENU_ITEMS: MenuItem[] = [
  { key: "dashboard", label: "Dashboard", icon: "grid-outline" },
  { key: "submissao", label: "Nova Submissão", icon: "cloud-upload-outline" },
  { key: "regras", label: "Regras do Curso", icon: "book-outline" },
  { key: "notificacoes", label: "Notificações", icon: "notifications-outline" },
];

/** Dados mínimos do usuário exibidos no cabeçalho do drawer. */
interface User {
  name: string;
  email: string;
}

/**
 * Props (parâmetros) do componente SideDrawer:
 *  - visible:    se o drawer deve estar aberto (controlado pela tela pai)
 *  - onClose:    callback chamado para fechar o drawer (toque no overlay, etc)
 *  - user:       usuário logado, para preencher o cabeçalho
 *  - activeItem: qual item está ativo agora (destaca visualmente)
 *  - onSelect:   callback ao escolher um item — recebe a key escolhida
 *  - onLogout:   callback ao tocar em "Sair"
 */
interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: User;
  activeItem: MenuItemKey;
  onSelect: (item: MenuItemKey) => void;
  onLogout: () => void;
}

// Vai receber as propriedades o componente recebe aquelas propriedadesanteriormente e as desestrutura para usá-las dentro da lógica do menu lateral.

export default function SideDrawer({
  visible,
  onClose,
  user,
  activeItem,
  onSelect,
  onLogout,
}: SideDrawerProps) {
  // Espaçamentos seguros (notch, barra de status, gestos) do aparelho.
  // Usados para o conteúdo não ficar embaixo da câmera/barra inferior.
  const insets = useSafeAreaInsets();

  // ─── Valores animados ──────────────────────────────────────────────────────
  // translateX:    posição horizontal do painel. Começa "escondido" à esquerda
  //                (-DRAWER_WIDTH) e anima até 0 (totalmente visível).
  // overlayOpacity: opacidade do fundo escurecido. Vai de 0 (transparente) a 1.
  //
  // useRef garante que o mesmo Animated.Value sobreviva entre re-renderizações
  // (se criássemos um novo a cada render, a animação "pularia").
  const translateX = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;

  // Controla se o <Modal> está montado na árvore. É necessário porque, ao
  // fechar, queremos que a animação de SAÍDA termine ANTES de desmontar.
  // Inicia igual a `visible` para refletir o estado inicial.
  const [isMounted, setIsMounted] = React.useState(visible);

  // ─── Efeito que dispara as animações quando `visible` muda ─────────────────
  React.useEffect(() => {
    if (visible) {
      // ABRINDO: monta o modal e anima o painel entrando + overlay aparecendo.
      setIsMounted(true);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0, // posição final: totalmente visível
          duration: 280,
          useNativeDriver: true, // anima na thread nativa (mais fluido)
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1, // fundo totalmente escurecido
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // FECHANDO: anima o painel saindo + overlay sumindo. Só DEPOIS que a
      // animação termina (callback do .start) é que desmontamos o modal,
      // chamando setIsMounted(false). Isso evita o "corte seco" no fechamento.
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH, // volta para fora da tela (esquerda)
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start(() => setIsMounted(false));
    }
  }, [visible, translateX, overlayOpacity]);

  // Primeira letra do nome, em maiúsculo, usada como "avatar" textual.
  const avatarInitial = user.name.charAt(0).toUpperCase();

  /**
   * Ao tocar num item do menu:
   *   1. Notifica a tela pai da escolha (onSelect), que cuida da navegação.
   *   2. Fecha o drawer (onClose).
   * A ordem importa: avisamos a seleção e em seguida iniciamos o fechamento.
   */
  const handleSelect = (key: MenuItemKey) => {
    onSelect(key);
    onClose();
  };

  return (
    // O Modal renderiza por cima de tudo. `transparent` deixa ver o conteúdo
    // atrás; `animationType="none"` porque a animação é feita manualmente com
    // Animated; `onRequestClose` trata o botão "voltar" do Android.
    <Modal
      visible={isMounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Deixa a barra de status clara sobre o fundo escuro do overlay. */}
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* ── Overlay (fundo escurecido) ──────────────────────────────────────
          A opacidade é animada (fade). O Pressable cobre a tela toda: tocar
          fora do painel fecha o drawer. pointerEvents desativa o toque quando
          o drawer está fechando, evitando cliques fantasmas. */}
      <Animated.View
        style={[styles.overlayContainer, { opacity: overlayOpacity }]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <Pressable style={styles.overlayPressable} onPress={onClose} />
      </Animated.View>

      {/* ── Painel do drawer (desliza horizontalmente) ──────────────────────
          O transform translateX é o valor animado: faz o painel entrar/sair.
          paddingTop/Bottom usam os insets para respeitar notch e gestos. */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateX }],
          },
        ]}
      >
        {/* ── Header do usuário: avatar (inicial) + nome + email ── */}
        <View style={styles.userHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarInitial}</Text>
          </View>
          <View style={styles.userInfo}>
            {/* numberOfLines={1} evita quebra de linha em nomes/emails longos */}
            <Text style={styles.userName} numberOfLines={1}>
              {user.name}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Lista de itens do menu ──────────────────────────────────────
            ScrollView para o caso de a lista crescer além da altura da tela.
            Cada item é renderizado a partir do array MENU_ITEMS. */}
        <ScrollView
          style={styles.menuList}
          contentContainerStyle={styles.menuListContent}
          showsVerticalScrollIndicator={false}
        >
          {MENU_ITEMS.map((item) => {
            // `active` indica o item correspondente à tela atual, para
            // aplicar o estilo de destaque (menuItemActive).
            const active = item.key === activeItem;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.menuItem, active && styles.menuItemActive]}
                onPress={() => handleSelect(item.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color="#FFFFFF"
                  style={styles.menuIcon}
                />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Botão Sair ──────────────────────────────────────────────────
            Fica fixo no rodapé do painel. Dispara onLogout, que é tratado
            pela tela pai (limpa token, redireciona para o login, etc). */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={onLogout}
          activeOpacity={0.7}
        >
          <Ionicons
            name="log-out-outline"
            size={22}
            color="#FFFFFF"
            style={styles.menuIcon}
          />
          <Text style={styles.logoutLabel}>Sair</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}
