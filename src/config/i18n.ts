import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  es: {
    translation: {
      menu: {
        brand: "Sabor",
        suffix: "Express",
        slogan: "Panel de administración",
        dashboard: "Dashboard",
        orders: "Pedidos",
        audit: "Auditoría de caja",
        inventory: "Inventario",
        staff: "Personal",
        config: "Configuración",
      },
      login: {
        title1: "Iniciar",
        title2: "Sesión",
        subtitle: "Bienvenido de nuevo a su sistema",
        email: "Correo electrónico",
        password: "Contraseña",
        submit: "Ingresar",
        success: "¡Sus credenciales son correctas!",
        error: "Credenciales incorrectas, intente de nuevo.",
        description: "Plataforma integral de gestión y entregas",
      },
      modal: {
        success: "¡Éxito!",
        error: "Error",
        warning: "¡Atención!",
        understood: "Entendido",
      },
    },
  },

  en: {
    translation: {
      menu: {
        brand: "Flavor",
        suffix: "Express",
        slogan: "Admin panel",
        dashboard: "Dashboard",
        orders: "Orders",
        audit: "Cash audit",
        inventory: "Inventory",
        staff: "Staff",
        config: "Settings",
      },
      login: {
        title1: "Login",
        title2: "System",
        subtitle: "Welcome back to your system",
        email: "Email",
        password: "Password",
        submit: "Sign in",
        success: "Your credentials are correct!",
        error: "Incorrect credentials, please try again.",
        description: "Comprehensive management and delivery platform",
      },
      modal: {
        success: "Success!",
        error: "Error",
        warning: "Warning!",
        understood: "Understood",
      },
    },
  },

  pt: {
    translation: {
      menu: {
        brand: "Sabor",
        suffix: "Express",
        slogan: "Painel de administração",
        dashboard: "Painel",
        orders: "Pedidos",
        audit: "Auditoria de caixa",
        inventory: "Estoque",
        staff: "Equipe",
        config: "Configurações",
      },
      login: {
        title1: "Iniciar",
        title2: "Sistema",
        subtitle: "Bem-vindo de volta ao seu sistema",
        email: "E-mail",
        password: "Senha",
        submit: "Entrar",
        success: "Suas credenciais estão corretas!",
        error: "Credenciais incorretas, tente novamente.",
        description: "Plataforma integrada de gestão e entregas",
      },
      modal: {
        success: "Sucesso!",
        error: "Erro",
        warning: "Atenção!",
        understood: "Entendido",
      },
    },
  },

  fr: {
    translation: {
      menu: {
        brand: "Saveur",
        suffix: "Express",
        slogan: "Panneau d'administration",
        dashboard: "Tableau de bord",
        orders: "Commandes",
        audit: "Audit de caisse",
        inventory: "Inventaire",
        staff: "Personnel",
        config: "Paramètres",
      },
      login: {
        title1: "Connexion",
        title2: "Système",
        subtitle: "Bienvenue dans votre système",
        email: "E-mail",
        password: "Mot de passe",
        submit: "Se connecter",
        success: "Vos identifiants sont corrects !",
        error: "Identifiants incorrects, veuillez réessayer.",
        description: "Plateforme complète de gestion et de livraisons",
      },
      modal: {
        success: "Succès !",
        error: "Erreur",
        warning: "Attention !",
        understood: "Compris",
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "es",
  fallbackLng: "es",
  load: "languageOnly",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
