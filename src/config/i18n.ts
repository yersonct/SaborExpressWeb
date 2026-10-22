import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  es: {
    translation: {
      menu: {
        brand: "Sabor",
        suffix: "Express",
        slogan: "Panel de administración",
        dashboard: "Panel general",
        orders: "Pedidos",
        audit: "Caja y pagos",
        inventory: "Productos",
        staff: "Equipo",
        config: "Ajustes",
      },
      login: {
        title1: "Iniciar",
        title2: "Sesión",
        subtitle: "Bienvenido de nuevo a su sistema",
        email: "Correo electrónico",
        password: "Contraseña",
        email_required: "Ingresa tu correo electrónico.",
        email_invalid: "Ingresa un correo electrónico válido.",
        password_required: "Ingresa tu contraseña.",
        submit: "Ingresar",
        success: "¡Sus credenciales son correctas!",
        error: "Credenciales incorrectas, intente de nuevo.",
        session_replaced: "Esta cuenta inició sesión en otro dispositivo. Inicia sesión de nuevo.",
        role_expired: "Tu turno terminó y ya no tienes rol de gerente o administrador. Se cerró tu sesión del panel web.",
        shift_changed: "Tu turno o tus permisos cambiaron. Inicia sesión de nuevo para actualizar el acceso.",
        branch_changed: "La sede asociada a tu cuenta cambió. Inicia sesión de nuevo para actualizar tus permisos.",
        branch_disabled: "La sede fue desactivada y se cerró tu sesión. Contacta al administrador si necesitas acceso.",
        employee_deleted: "Tu cuenta de empleado fue eliminada permanentemente. Contacta al gerente o administrador si necesitas aclararlo.",
        description: "Plataforma integral de gestión y entregas",
      },
      modal: {
        success: "¡Éxito!",
        error: "Error",
        warning: "¡Atención!",
        understood: "Entendido",
      },
      languageSelector: "Cambiar idioma",
      app: {
        title: "Panel de administración | SaborExpress",
        description: "Panel web de administración de SaborExpress.",
      },
      letter: {
        title: "Menú digital | SaborExpress",
        description: "Consulta los productos y precios disponibles del restaurante.",
      },
    },
  },

  en: {
    translation: {
      menu: {
        brand: "Sabor",
        suffix: "Express",
        slogan: "Admin panel",
        dashboard: "Overview",
        orders: "Orders",
        audit: "Cash & payments",
        inventory: "Products",
        staff: "Team",
        config: "Settings",
      },
      login: {
        title1: "Login",
        title2: "System",
        subtitle: "Welcome back to your system",
        email: "Email",
        password: "Password",
        email_required: "Enter your email address.",
        email_invalid: "Enter a valid email address.",
        password_required: "Enter your password.",
        submit: "Sign in",
        success: "Your credentials are correct!",
        error: "Incorrect credentials, please try again.",
        session_replaced: "This account signed in on another device. Please sign in again.",
        role_expired: "Your shift ended and you no longer have a manager or administrator role. Your web panel session was closed.",
        shift_changed: "Your shift or permissions changed. Sign in again to update your access.",
        branch_changed: "The branch linked to your account changed. Sign in again to update your permissions.",
        branch_disabled: "The branch was deactivated and your session was closed. Contact an administrator if you need access.",
        employee_deleted: "Your employee account was permanently deleted. Contact a manager or administrator if you need help.",
        description: "Comprehensive management and delivery platform",
      },
      modal: {
        success: "Success!",
        error: "Error",
        warning: "Warning!",
        understood: "Understood",
      },
      languageSelector: "Change language",
      app: {
        title: "Admin dashboard | SaborExpress",
        description: "SaborExpress web administration dashboard.",
      },
      letter: {
        title: "Digital menu | SaborExpress",
        description: "Browse the restaurant's available products and prices.",
      },
    },
  },

  pt: {
    translation: {
      menu: {
        brand: "Sabor",
        suffix: "Express",
        slogan: "Painel de administração",
        dashboard: "Visão geral",
        orders: "Pedidos",
        audit: "Caixa e pagamentos",
        inventory: "Produtos",
        staff: "Equipe",
        config: "Ajustes",
      },
      login: {
        title1: "Iniciar",
        title2: "Sistema",
        subtitle: "Bem-vindo de volta ao seu sistema",
        email: "E-mail",
        password: "Senha",
        email_required: "Informe seu endereço de e-mail.",
        email_invalid: "Informe um endereço de e-mail válido.",
        password_required: "Informe sua senha.",
        submit: "Entrar",
        success: "Suas credenciais estão corretas!",
        error: "Credenciais incorretas, tente novamente.",
        session_replaced: "Esta conta iniciou sessão em outro dispositivo. Entre novamente.",
        role_expired: "Seu turno terminou e você não tem mais o cargo de gerente ou administrador. Sua sessão do painel web foi encerrada.",
        shift_changed: "Seu turno ou suas permissões mudaram. Entre novamente para atualizar seu acesso.",
        branch_changed: "A unidade vinculada à sua conta mudou. Entre novamente para atualizar suas permissões.",
        branch_disabled: "A unidade foi desativada e sua sessão foi encerrada. Fale com um administrador se precisar de acesso.",
        employee_deleted: "Sua conta de funcionário foi excluída permanentemente. Fale com um gerente ou administrador se precisar de ajuda.",
        description: "Plataforma integrada de gestão e entregas",
      },
      modal: {
        success: "Sucesso!",
        error: "Erro",
        warning: "Atenção!",
        understood: "Entendido",
      },
      languageSelector: "Alterar idioma",
      app: {
        title: "Painel administrativo | SaborExpress",
        description: "Painel web de administração do SaborExpress.",
      },
      letter: {
        title: "Cardápio digital | SaborExpress",
        description: "Consulte os produtos e preços disponíveis no restaurante.",
      },
    },
  },

  fr: {
    translation: {
      menu: {
        brand: "Sabor",
        suffix: "Express",
        slogan: "Panneau d'administration",
        dashboard: "Vue d’ensemble",
        orders: "Commandes",
        audit: "Caisse et paiements",
        inventory: "Produits",
        staff: "Équipe",
        config: "Paramètres",
      },
      login: {
        title1: "Connexion",
        title2: "Système",
        subtitle: "Bienvenue dans votre système",
        email: "E-mail",
        password: "Mot de passe",
        email_required: "Saisissez votre adresse e-mail.",
        email_invalid: "Saisissez une adresse e-mail valide.",
        password_required: "Saisissez votre mot de passe.",
        submit: "Se connecter",
        success: "Vos identifiants sont corrects !",
        error: "Identifiants incorrects, veuillez réessayer.",
        session_replaced: "Ce compte s'est connecté sur un autre appareil. Veuillez vous reconnecter.",
        role_expired: "Votre service est terminé et vous n'avez plus le rôle de responsable ou d'administrateur. Votre session du panneau web a été fermée.",
        shift_changed: "Votre service ou vos autorisations ont changé. Reconnectez-vous pour mettre à jour votre accès.",
        branch_changed: "L'établissement associé à votre compte a changé. Reconnectez-vous pour mettre à jour vos autorisations.",
        branch_disabled: "L'établissement a été désactivé et votre session a été fermée. Contactez un administrateur si vous avez besoin d'un accès.",
        employee_deleted: "Votre compte employé a été supprimé définitivement. Contactez un responsable ou un administrateur si besoin.",
        description: "Plateforme complète de gestion et de livraisons",
      },
      modal: {
        success: "Succès !",
        error: "Erreur",
        warning: "Attention !",
        understood: "Compris",
      },
      languageSelector: "Changer de langue",
      app: {
        title: "Administration | SaborExpress",
        description: "Panneau web d'administration de SaborExpress.",
      },
      letter: {
        title: "Menu numérique | SaborExpress",
        description: "Consultez les produits et les prix disponibles au restaurant.",
      },
    },
  },
};

const menuTranslations = {
  es: { branches: "Sedes", deliveries: "Domicilios", reviews: "Opiniones", tables: "Mesas", schedules: "Horarios", groupOperations: "OPERACIÓN", groupRestaurant: "RESTAURANTE", navigation: "Navegación principal", openMenu: "Abrir menú", closeMenu: "Cerrar menú" },
  en: { branches: "Branches", deliveries: "Deliveries", reviews: "Customer reviews", tables: "Tables", schedules: "Schedules", groupOperations: "OPERATIONS", groupRestaurant: "RESTAURANT", navigation: "Main navigation", openMenu: "Open menu", closeMenu: "Close menu" },
  pt: { branches: "Unidades", deliveries: "Entregas", reviews: "Avaliações", tables: "Mesas", schedules: "Horários", groupOperations: "OPERAÇÃO", groupRestaurant: "RESTAURANTE", navigation: "Navegação principal", openMenu: "Abrir menu", closeMenu: "Fechar menu" },
  fr: { branches: "Sites", deliveries: "Livraisons", reviews: "Avis clients", tables: "Tables", schedules: "Horaires", groupOperations: "OPÉRATIONS", groupRestaurant: "RESTAURANT", navigation: "Navigation principale", openMenu: "Ouvrir le menu", closeMenu: "Fermer le menu" },
} as const;

const configurationTranslations = {
  es: { currentPasswordHelp: "Escribe la contraseña actual de {{email}} para actualizar esa cuenta. El sistema no puede mostrarla ni rellenarla automáticamente.", currentPasswordPlaceholder: "Escribe la contraseña actual", title: "Configuración del sistema", description: "Administra tu perfil, la configuración del restaurante y la seguridad de tu cuenta.", profile: "Perfil del administrador", restaurant: "Ajustes del restaurante", menu: "Carta digital (QR)", security: "Seguridad y accesos", personalInfo: "Información personal", name: "Nombre", lastName: "Apellido", email: "Correo electrónico", phone: "Teléfono de contacto", role: "Rol", edit: "Editar", cancel: "Cancelar", save: "Guardar cambios", saving: "Guardando..." },
  en: { currentPasswordHelp: "Enter the current password for {{email}} to update that account. The system cannot display or fill it automatically.", currentPasswordPlaceholder: "Enter your current password", title: "System settings", description: "Manage your profile, restaurant settings, and account security.", profile: "Administrator profile", restaurant: "Restaurant settings", menu: "Digital menu (QR)", security: "Security and access", personalInfo: "Personal information", name: "First name", lastName: "Last name", email: "Email", phone: "Contact phone", role: "Role", edit: "Edit", cancel: "Cancel", save: "Save changes", saving: "Saving..." },
  pt: { currentPasswordHelp: "Digite a senha atual de {{email}} para atualizar essa conta. O sistema não pode mostrá-la nem preenchê-la automaticamente.", currentPasswordPlaceholder: "Digite sua senha atual", title: "Configurações do sistema", description: "Gerencie seu perfil, as configurações do restaurante e a segurança da conta.", profile: "Perfil do administrador", restaurant: "Configurações do restaurante", menu: "Cardápio digital (QR)", security: "Segurança e acesso", personalInfo: "Informações pessoais", name: "Nome", lastName: "Sobrenome", email: "E-mail", phone: "Telefone de contato", role: "Função", edit: "Editar", cancel: "Cancelar", save: "Salvar alterações", saving: "Salvando..." },
  fr: { currentPasswordHelp: "Saisissez le mot de passe actuel de {{email}} pour modifier ce compte. Le système ne peut pas afficher ou remplir ce champ automatiquement.", currentPasswordPlaceholder: "Saisissez votre mot de passe actuel", title: "Paramètres du système", description: "Gérez votre profil, les paramètres du restaurant et la sécurité du compte.", profile: "Profil administrateur", restaurant: "Paramètres du restaurant", menu: "Menu numérique (QR)", security: "Sécurité et accès", personalInfo: "Informations personnelles", name: "Prénom", lastName: "Nom", email: "E-mail", phone: "Téléphone de contact", role: "Rôle", edit: "Modifier", cancel: "Annuler", save: "Enregistrer les modifications", saving: "Enregistrement..." },
} as const;

const authFlowTranslations = {
  es: {
    forgot_password: "¿Olvidaste tu contraseña?",
    forgot: { progress: "Paso {{current}} de {{total}}", step1_title: "Recuperar contraseña", step1_desc: "Ingresa tu correo para recibir un código.", send_code: "Enviar código", step2_title: "Ingresa el código", step2_desc: "Revisa tu bandeja de entrada.", code: "Código de 6 dígitos", verify: "Verificar código", step3_title: "Nueva contraseña", step3_desc: "Crea tu nueva contraseña segura.", new_password: "Nueva contraseña", confirm_password: "Confirmar contraseña", save: "Guardar contraseña", email_required: "Ingresa tu correo electrónico.", email_invalid: "Ingresa un correo electrónico válido.", code_required: "Ingresa el código.", code_invalid: "El código debe contener exactamente 6 dígitos.", password_required: "Ingresa una contraseña nueva.", password_min: "La contraseña debe tener al menos 8 caracteres.", confirm_required: "Confirma tu contraseña.", password_mismatch: "Las contraseñas no coinciden." },
  },
  en: {
    forgot_password: "Forgot your password?",
    forgot: { progress: "Step {{current}} of {{total}}", step1_title: "Reset password", step1_desc: "Enter your email to receive a code.", send_code: "Send code", step2_title: "Enter the code", step2_desc: "Check your inbox.", code: "6-digit code", verify: "Verify code", step3_title: "New password", step3_desc: "Create a secure new password.", new_password: "New password", confirm_password: "Confirm password", save: "Save password", email_required: "Enter your email address.", email_invalid: "Enter a valid email address.", code_required: "Enter the code.", code_invalid: "The code must contain exactly 6 digits.", password_required: "Enter a new password.", password_min: "The password must be at least 8 characters long.", confirm_required: "Confirm your password.", password_mismatch: "The passwords do not match." },
  },
  pt: {
    forgot_password: "Esqueceu sua senha?",
    forgot: { progress: "Etapa {{current}} de {{total}}", step1_title: "Redefinir senha", step1_desc: "Digite seu e-mail para receber um código.", send_code: "Enviar código", step2_title: "Digite o código", step2_desc: "Verifique sua caixa de entrada.", code: "Código de 6 dígitos", verify: "Verificar código", step3_title: "Nova senha", step3_desc: "Crie uma nova senha segura.", new_password: "Nova senha", confirm_password: "Confirmar senha", save: "Salvar senha", email_required: "Informe seu endereço de e-mail.", email_invalid: "Informe um endereço de e-mail válido.", code_required: "Informe o código.", code_invalid: "O código deve conter exatamente 6 dígitos.", password_required: "Informe uma nova senha.", password_min: "A senha deve ter pelo menos 8 caracteres.", confirm_required: "Confirme sua senha.", password_mismatch: "As senhas não coincidem." },
  },
  fr: {
    forgot_password: "Mot de passe oublié ?",
    forgot: { progress: "Étape {{current}} sur {{total}}", step1_title: "Réinitialiser le mot de passe", step1_desc: "Saisissez votre e-mail pour recevoir un code.", send_code: "Envoyer le code", step2_title: "Saisissez le code", step2_desc: "Consultez votre boîte de réception.", code: "Code à 6 chiffres", verify: "Vérifier le code", step3_title: "Nouveau mot de passe", step3_desc: "Créez un nouveau mot de passe sécurisé.", new_password: "Nouveau mot de passe", confirm_password: "Confirmer le mot de passe", save: "Enregistrer le mot de passe", email_required: "Saisissez votre adresse e-mail.", email_invalid: "Saisissez une adresse e-mail valide.", code_required: "Saisissez le code.", code_invalid: "Le code doit contenir exactement 6 chiffres.", password_required: "Saisissez un nouveau mot de passe.", password_min: "Le mot de passe doit contenir au moins 8 caractères.", confirm_required: "Confirmez votre mot de passe.", password_mismatch: "Les mots de passe ne correspondent pas." },
  },
} as const;

const orderBreakdownTranslations = {
  es: { taxOnProducts: "Impoconsumo sobre productos" },
  en: { taxOnProducts: "Consumption tax on products" },
  pt: { taxOnProducts: "Imposto sobre consumo dos produtos" },
  fr: { taxOnProducts: "Taxe sur les produits" },
} as const;

const pageTitleTranslations = {
  es: { branches: "Sedes", myBranch: "Mi sede", dashboard: "Panel general", deliveries: "Gestión de domicilios", employees: "Equipo de trabajo", schedules: "Horarios y turnos", orders: "Gestión de pedidos", audit: "Caja y pagos", inventory: "Productos e inventario", reviews: "Opiniones de clientes", tables: "Mesas" },
  en: { branches: "Branches", myBranch: "My branch", dashboard: "Overview", deliveries: "Delivery management", employees: "Team management", schedules: "Schedules", orders: "Order management", audit: "Cash and payments", inventory: "Products and inventory", reviews: "Customer reviews", tables: "Tables" },
  pt: { branches: "Unidades", myBranch: "Minha unidade", dashboard: "Visão geral", deliveries: "Gestão de entregas", employees: "Gestão da equipe", schedules: "Horários", orders: "Gestão de pedidos", audit: "Caixa e pagamentos", inventory: "Produtos e estoque", reviews: "Avaliações de clientes", tables: "Mesas" },
  fr: { branches: "Sites", myBranch: "Mon site", dashboard: "Vue d’ensemble", deliveries: "Gestion des livraisons", employees: "Gestion de l’équipe", schedules: "Horaires", orders: "Gestion des commandes", audit: "Caisse et paiements", inventory: "Produits et inventaire", reviews: "Avis clients", tables: "Tables" },
} as const;

const appearanceTranslations = {
  es: { toggleTheme: "Cambiar tema" },
  en: { toggleTheme: "Switch theme" },
  pt: { toggleTheme: "Mudar tema" },
  fr: { toggleTheme: "Changer le thème" },
} as const;

const webRequestTranslations = {
  es: {
    title: "Actividad en tiempo real",
    button: "Ver actividad de solicitudes",
    description: "Cambios enviados desde los módulos del panel.",
    empty: "Aún no hay solicitudes recientes.",
    received: "Llegó al servidor",
    response: "Respuesta enviada",
    waiting: "Esperando respuesta",
    completed: "Completada",
    failed: "Falló",
    close: "Cerrar actividad",
    manager: "Gerente",
    administrator: "Administrador",
    create: "Crear",
    update: "Actualizar",
    delete: "Eliminar",
    httpStatus: "Estado HTTP {{statusCode}}",
    duration: "{{duration}} ms",
    clear: "Limpiar actividad",
    modules: {
      authentication: "Accesos", branches: "Sedes", categories: "Categorías",
      products: "Productos", orders: "Pedidos", payments: "Caja y pagos",
      tables: "Mesas", deliveries: "Domicilios", reviews: "Opiniones",
      employees: "Equipo", schedules: "Horarios", addresses: "Direcciones",
      customers: "Clientes", kitchen: "Cocina",
      configurations: "Ajustes", access: "Permisos y roles", invoices: "Facturas",
      notifications: "Notificaciones", other: "Otros módulos",
    },
  },
  en: {
    title: "Live activity",
    button: "View request activity",
    description: "Changes sent from the dashboard modules.",
    empty: "There are no recent requests.",
    received: "Received by server",
    response: "Response sent",
    waiting: "Waiting for response",
    completed: "Completed",
    failed: "Failed",
    close: "Close activity",
    manager: "Manager",
    administrator: "Administrator",
    create: "Create",
    update: "Update",
    delete: "Delete",
    httpStatus: "HTTP status {{statusCode}}",
    duration: "{{duration}} ms",
    clear: "Clear activity",
    modules: {
      authentication: "Access", branches: "Branches", categories: "Categories",
      products: "Products", orders: "Orders", payments: "Cash and payments",
      tables: "Tables", deliveries: "Deliveries", reviews: "Reviews",
      employees: "Team", schedules: "Schedules", addresses: "Addresses",
      customers: "Customers", kitchen: "Kitchen",
      configurations: "Settings", access: "Permissions and roles", invoices: "Invoices",
      notifications: "Notifications", other: "Other modules",
    },
  },
  pt: {
    title: "Atividade em tempo real",
    button: "Ver atividade das solicitações",
    description: "Alterações enviadas pelos módulos do painel.",
    empty: "Ainda não há solicitações recentes.",
    received: "Recebida pelo servidor",
    response: "Resposta enviada",
    waiting: "Aguardando resposta",
    completed: "Concluída",
    failed: "Falhou",
    close: "Fechar atividade",
    manager: "Gerente",
    administrator: "Administrador",
    create: "Criar",
    update: "Atualizar",
    delete: "Excluir",
    httpStatus: "Status HTTP {{statusCode}}",
    duration: "{{duration}} ms",
    clear: "Limpar atividade",
    modules: {
      authentication: "Acessos", branches: "Unidades", categories: "Categorias",
      products: "Produtos", orders: "Pedidos", payments: "Caixa e pagamentos",
      tables: "Mesas", deliveries: "Entregas", reviews: "Avaliações",
      employees: "Equipe", schedules: "Horários", addresses: "Endereços",
      customers: "Clientes", kitchen: "Cozinha",
      configurations: "Configurações", access: "Permissões e funções", invoices: "Notas fiscais",
      notifications: "Notificações", other: "Outros módulos",
    },
  },
  fr: {
    title: "Activité en temps réel",
    button: "Voir l'activité des requêtes",
    description: "Modifications envoyées depuis les modules du panneau.",
    empty: "Aucune requête récente.",
    received: "Reçue par le serveur",
    response: "Réponse envoyée",
    waiting: "En attente de réponse",
    completed: "Terminée",
    failed: "Échec",
    close: "Fermer l'activité",
    manager: "Gérant",
    administrator: "Administrateur",
    create: "Créer",
    update: "Modifier",
    delete: "Supprimer",
    httpStatus: "Statut HTTP {{statusCode}}",
    duration: "{{duration}} ms",
    clear: "Effacer l'activité",
    modules: {
      authentication: "Accès", branches: "Sites", categories: "Catégories",
      products: "Produits", orders: "Commandes", payments: "Caisse et paiements",
      tables: "Tables", deliveries: "Livraisons", reviews: "Avis",
      employees: "Équipe", schedules: "Horaires", addresses: "Adresses",
      customers: "Clients", kitchen: "Cuisine",
      configurations: "Paramètres", access: "Autorisations et rôles", invoices: "Factures",
      notifications: "Notifications", other: "Autres modules",
    },
  },
} as const;

for (const language of ["es", "en", "pt", "fr"] as const) {
  Object.assign(resources[language].translation, {
    configuration: configurationTranslations[language],
    forgot: authFlowTranslations[language].forgot,
    orderBreakdown: orderBreakdownTranslations[language],
    pageTitles: pageTitleTranslations[language],
    appearance: appearanceTranslations[language],
    webRequests: webRequestTranslations[language],
  });
  Object.assign(resources[language].translation.login, {
    forgot_password: authFlowTranslations[language].forgot_password,
  });
  Object.assign(resources[language].translation.menu, menuTranslations[language]);
}

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
