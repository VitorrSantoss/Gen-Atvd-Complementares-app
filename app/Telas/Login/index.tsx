// ============================================================
// IMPORTAÇÕES
// ============================================================

import { Ionicons } from "@expo/vector-icons"; // Biblioteca de ícones (olho, alerta etc.)
import { LinearGradient } from "expo-linear-gradient"; // Componente de gradiente de fundo
import { useRouter } from "expo-router"; // Hook de navegação entre telas
import React, { useState } from "react"; // React e hook de estado
import {
    ActivityIndicator,   // Spinner de carregamento
    Image,               // Exibe imagens
    KeyboardAvoidingView,// Sobe o conteúdo quando o teclado abre
    Platform,            // Detecta se é iOS ou Android
    ScrollView,          // Permite rolar a tela
    StatusBar,           // Controla a barra de status do celular
    Text,                // Componente de texto
    TextInput,           // Campo de entrada de texto
    TouchableOpacity,    // Botão com feedback de toque
    View,                // Container genérico de layout
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // Respeita notch/barra de navegação do celular

import { useAuth } from "../../../contexts/AuthContext"; // Contexto de autenticação (função de login)
import { styles } from "./style"; // Estilos externos da tela

// ============================================================
// ASSETS (imagens locais)
// ============================================================

const logoSenac = require("../../../assets/images/logo_senac_branca.png");
const logoGENAT = require("../../../assets/images/logoGENAT.png");

// ============================================================
// COMPONENTE PRINCIPAL: LoginScreen
// ============================================================

export default function LoginScreen() {
  const router = useRouter();       // Usado para navegar para outra tela após login
  const insets = useSafeAreaInsets(); // Margens seguras (evita sobreposição com notch/barra)
  const { login } = useAuth();      // Função de login vinda do contexto global de autenticação

  // ---------- ESTADOS LOCAIS ----------
  const [email, setEmail] = useState("");           // Armazena o e-mail digitado
  const [password, setPassword] = useState("");     // Armazena a senha digitada
  const [showPassword, setShowPassword] = useState(false); // Alterna visibilidade da senha
  const [loading, setLoading] = useState(false);    // Controla o spinner durante o login
  const [error, setError] = useState("");           // Armazena mensagem de erro para exibição

  // ============================================================
  // FUNÇÃO DE LOGIN
  // ============================================================

  const handleLogin = async () => {
    // Validação básica: campos não podem estar vazios
    if (!email.trim() || !password.trim()) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setError("");       // Limpa erros anteriores
    setLoading(true);   // Ativa o spinner

    try {
      await login(email.trim(), password); // Chama a função de autenticação
      router.replace("/Telas/Dashboard");  // Redireciona para o Dashboard em caso de sucesso
    } catch (err: any) {
      // Trata erros com base no status HTTP retornado
      const status = err?.response?.status;

      if (status === 401) {
        setError("E-mail ou senha inválidos."); // Credenciais incorretas
      } else if (status === 403) {
        setError("Acesso negado."); // Sem permissão
      } else if (err?.message?.includes("Acesso restrito")) {
        setError(err.message); // Mensagem de restrição personalizada
      } else {
        // Erro genérico com detalhes para depuração
        setError(
          `Erro: ${err?.message} | status: ${err?.response?.status} | ${JSON.stringify(err?.response?.data)}`,
        );
      }
    } finally {
      setLoading(false); // Desativa o spinner independente do resultado
    }
  };

  // ============================================================
  // RENDERIZAÇÃO DA TELA
  // ============================================================

  return (
    <View style={styles.root}>

      {/* --- FUNDO COM GRADIENTE --- */}
      {/* pointerEvents="none" faz o gradiente não bloquear toques na tela */}
      <View style={styles.gradientLayer} pointerEvents="none">
        <LinearGradient
          colors={["#0D1F3C", "#162840", "#2E2016", "#1A0E08"]} // Azul escuro → marrom escuro
          locations={[0, 0.4, 0.75, 1]}  // Posição de cada cor (0 = topo, 1 = base)
          style={styles.gradientFill}
        />
      </View>

      {/* --- BARRA DE STATUS TRANSPARENTE COM ÍCONES CLAROS --- */}
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* --- EVITA QUE O TECLADO SOBREPONHA OS CAMPOS --- */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        // No iOS: empurra o conteúdo para cima; no Android: reduz a altura
      >

        {/* --- SCROLL PARA TELAS PEQUENAS OU TECLADO ABERTO --- */}
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 16,      // Respeita o notch/câmera
              paddingBottom: insets.bottom + 55, // Respeita a barra de navegação
            },
          ]}
          keyboardShouldPersistTaps="handled"   // Toque fora do teclado fecha-o sem ignorar botões
          showsVerticalScrollIndicator={false}  // Oculta a barra de rolagem lateral
        >

          {/* --- LOGO SENAC --- */}
          <View style={styles.logoArea}>
            <Image
              source={logoSenac}
              style={styles.logoImage}
              resizeMode="contain" // Mantém proporção sem cortar
            />
          </View>

          {/* --- TÍTULOS DA TELA --- */}
          <Text style={styles.title}>Atividades Complementares</Text>
          <Text style={styles.subtitle}>Faça login para continuar</Text>

          {/* --- FORMULÁRIO DE LOGIN --- */}
          <View style={styles.form}>

            {/* CAMPO DE E-MAIL */}
            <Text style={styles.fieldLabel}>E-mail</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Digite seu email"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={email}
                onChangeText={setEmail}           // Atualiza estado a cada tecla
                keyboardType="email-address"      // Teclado otimizado para e-mail
                autoCapitalize="none"             // Não capitaliza automaticamente
                autoCorrect={false}               // Desativa autocorreção
                editable={!loading}               // Bloqueia edição durante o carregamento
              />
            </View>

            {/* CAMPO DE SENHA */}
            <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Senha</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { paddingRight: 48 }]} // Espaço extra para o ícone do olho
                placeholder="••••••"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={password}
                onChangeText={setPassword}        // Atualiza estado a cada tecla
                secureTextEntry={!showPassword}   // Oculta/exibe texto da senha
                editable={!loading}               // Bloqueia edição durante o carregamento
              />

              {/* BOTÃO PARA ALTERNAR VISIBILIDADE DA SENHA */}
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((v) => !v)} // Inverte o estado atual
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"} // Ícone muda conforme estado
                  size={20}
                  color="rgba(255,255,255,0.7)"
                />
              </TouchableOpacity>
            </View>

            {/* MENSAGEM DE ERRO (só aparece se houver erro) */}
            {error ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 12,
                  backgroundColor: "rgba(255,107,107,0.15)", // Fundo vermelho translúcido
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color="#FF6B6B"
                />
                <Text style={{ color: "#FF6B6B", fontSize: 13, flex: 1 }}>
                  {error} {/* Texto do erro dinâmico */}
                </Text>
              </View>
            ) : null}

            {/* BOTÃO DE LOGIN */}
            <TouchableOpacity
              style={[styles.loginButton, loading && { opacity: 0.7 }]} // Fica semi-transparente durante loading
              onPress={handleLogin}
              activeOpacity={0.85} // Leve escurecimento ao toque
              disabled={loading}   // Desabilita o botão durante o carregamento
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" /> // Spinner branco durante login
              ) : (
                <Text style={styles.loginButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            {/* LINK "ESQUECI MINHA SENHA" */}
            <TouchableOpacity style={styles.forgotWrapper}>
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </TouchableOpacity>

          </View>

          {/* --- RODAPÉ COM LOGO GENAT --- */}
          <View style={styles.poweredByWrapper}>
            <Image
              source={logoGENAT}
              style={styles.genatLogo}
              resizeMode="contain"
            />
            <Text style={styles.poweredByText}>
              powered by <Text style={{ fontWeight: "bold" }}>genat</Text>
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
