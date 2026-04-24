import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  /* ── Overlay (fundo escuro animado) ── */
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },

  overlayPressable: {
    flex: 1,
  },

  /* ── Container do drawer (com slide) ── */
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: "#0D1F3C",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 16,
  },

  /* ── Header do usuário ── */
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 4,
    gap: 12,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#ba591c",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ba591c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },

  userInfo: {
    flex: 1,
  },

  userName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },

  userEmail: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "400",
  },

  /* ── Divisor ── */
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 4,
    marginHorizontal: -16,
  },

  /* ── Lista de itens ── */
  menuList: {
    flex: 1,
  },

  menuListContent: {
    paddingTop: 16,
    paddingBottom: 8,
  },

  /* Item padrão — sem borda, fundo transparente */
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "transparent",
  },

  /* Item ativo — apenas contorno laranja, sem fundo */
  menuItemActive: {
    backgroundColor: "#ba591c",
  },

  menuIcon: {
    marginRight: 14,
    width: 24,
  },

  /* Texto sempre branco, independente do estado */
  menuLabel: {
    fontSize: 15.5,
    fontWeight: "500",
    color: "#FFFFFF",
  },

  /* ── Botão sair (rodapé) ── */
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    marginHorizontal: -16,
    paddingLeft: 30,
  },

  logoutLabel: {
    fontSize: 15.5,
    fontWeight: "500",
    color: "#FFFFFF",
  },
});
