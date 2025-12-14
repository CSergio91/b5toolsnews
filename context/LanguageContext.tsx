import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LanguageCode, Translations } from '../types/languages';

const translations: Record<LanguageCode, Translations> = {
    es: {
        landing: {
            hero_tag: "La Herramienta del Momento",
            hero_title_1: "Lleva tu juego",
            hero_title_2: "al siguiente nivel.",
            hero_desc: "La plataforma oficial de anotación para Beisbol Five. Gestiona torneos, estadísticas y comparte resultados en tiempo real con una interfaz premium.",
            cta_start: "Empezar Gratis",
            login_welcome: "Bienvenido",
            login_subtitle: "Inicia sesión para continuar.",
            login_btn: "Iniciar Sesión",
            register_title: "Crear Cuenta",
            register_subtitle: "Únete a B5Tools hoy.",
            register_btn: "Crear Cuenta",
            forgot_pass: "¿Olvidaste tu contraseña?",
            no_account: "¿No tienes cuenta?",
            have_account: "¿Tienes cuenta?",
            club_info: "Información del Club (Opcional)",
            club_name_placeholder: "Nombre del Club",
            phone_placeholder: "Teléfono",
            whatsapp_label: "WhatsApp",
            available: "Disponible",
            name: "Nombre",
            lastname: "Apellidos",
            email: "Correo Electrónico",
            password: "Contraseña",
            confirm: "Confirmar",
            recover_title: "Recuperar Contraseña",
            recover_desc: "Ingresa tu correo para recibir un enlace de recuperación.",
            recover_btn: "Enviar Correo",
            recover_sending: "Enviando...",
            google_login: "Continuar con Google",
            or_email: "O con correo",
            loading: "Cargando...",
            register_link: "Regístrate Gratis",
            footer_rights: "© 2025 B5Tools. Desarrollada por B5Tools Development Team. Todos los derechos reservados."
        },
        navbar: {
            admin_club: "Administrar Club",
            my_tournaments: "Mis Torneos",
            broadcast: "Transmitir",
            my_account: "Mi Cuenta",
            edit_profile: "Editar Perfil",
            quick_game: "Juego Rápido",
            upgrade_plan: "Mejorar Plan",
            logout: "Cerrar Sesión",
            contact_us: "¿Tienes Dudas?"
        }
    },
    en: {
        landing: {
            hero_tag: "The Moment's Top Tool",
            hero_title_1: "Take your game",
            hero_title_2: "to the next level.",
            hero_desc: "The official Baseball5 scoring platform. Manage tournaments, statistics, and share real-time results with a premium interface.",
            cta_start: "Start for Free",
            login_welcome: "Welcome",
            login_subtitle: "Sign in to continue.",
            login_btn: "Sign In",
            register_title: "Create Account",
            register_subtitle: "Join B5Tools today.",
            register_btn: "Create Account",
            forgot_pass: "Forgot password?",
            no_account: "No account?",
            have_account: "Have an account?",
            club_info: "Club Information (Optional)",
            club_name_placeholder: "Club Name",
            phone_placeholder: "Phone",
            whatsapp_label: "WhatsApp",
            available: "Available",
            name: "Name",
            lastname: "Last Name",
            email: "Email",
            password: "Password",
            confirm: "Confirm",
            recover_title: "Recover Password",
            recover_desc: "Enter your email to receive a recovery link.",
            recover_btn: "Send Email",
            recover_sending: "Sending...",
            google_login: "Continue with Google",
            or_email: "Or with email",
            loading: "Loading...",
            register_link: "Register for Free",
            footer_rights: "© 2025 B5Tools. Developed by B5Tools Development Team. All rights reserved."
        },
        navbar: {
            admin_club: "Manage Club",
            my_tournaments: "My Tournaments",
            broadcast: "Broadcast",
            my_account: "My Account",
            edit_profile: "Edit Profile",
            quick_game: "Quick Game",
            upgrade_plan: "Upgrade Plan",
            logout: "Sign Out",
            contact_us: "Need Help?"
        }
    },
    pt: {
        landing: {
            hero_tag: "A Ferramenta do Momento",
            hero_title_1: "Leve o seu jogo",
            hero_title_2: "ao próximo nível.",
            hero_desc: "A plataforma oficial de pontuação de Baseball5. Gerencie torneios, estatísticas e compartilhe resultados em tempo real com uma interface premium.",
            cta_start: "Começar Grátis",
            login_welcome: "Bem-vindo",
            login_subtitle: "Faça login para continuar.",
            login_btn: "Entrar",
            register_title: "Criar Conta",
            register_subtitle: "Junte-se à B5Tools hoje.",
            register_btn: "Criar Conta",
            forgot_pass: "Esqueceu a senha?",
            no_account: "Não tem conta?",
            have_account: "Já tem conta?",
            club_info: "Informações do Clube (Opcional)",
            club_name_placeholder: "Nome do Clube",
            phone_placeholder: "Telefone",
            whatsapp_label: "WhatsApp",
            available: "Disponível",
            name: "Nome",
            lastname: "Sobrenome",
            email: "Email",
            password: "Senha",
            confirm: "Confirmar",
            recover_title: "Recuperar Senha",
            recover_desc: "Insira seu e-mail para receber um link de recuperação.",
            recover_btn: "Enviar E-mail",
            recover_sending: "Enviando...",
            google_login: "Continuar com Google",
            or_email: "Ou com e-mail",
            loading: "Carregando...",
            register_link: "Cadastre-se Grátis",
            footer_rights: "© 2025 B5Tools. Desenvolvido pela Equipe de Desenvolvimento B5Tools. Todos os direitos reservados."
        },
        navbar: {
            admin_club: "Gerenciar Clube",
            my_tournaments: "Meus Torneios",
            broadcast: "Transmitir",
            my_account: "Minha Conta",
            edit_profile: "Editar Perfil",
            quick_game: "Jogo Rápido",
            upgrade_plan: "Melhorar Plano",
            logout: "Sair",
            contact_us: "Precisa de Ajuda?"
        }
    },
    fr: {
        landing: {
            hero_tag: "L'Outil du Moment",
            hero_title_1: "Passez votre jeu",
            hero_title_2: "au niveau supérieur.",
            hero_desc: "La plateforme officielle du Baseball5. Gérez tournois, statistiques et partagez les résultats en temps réel avec une interface premium.",
            cta_start: "Commencer Gratuitement",
            login_welcome: "Bienvenue",
            login_subtitle: "Connectez-vous pour continuer.",
            login_btn: "Se Connecter",
            register_title: "Créer un Compte",
            register_subtitle: "Rejoignez B5Tools aujourd'hui.",
            register_btn: "Créer un Compte",
            forgot_pass: "Mot de passe oublié ?",
            no_account: "Pas de compte ?",
            have_account: "Vous avez un compte ?",
            club_info: "Infos Club (Optionnel)",
            club_name_placeholder: "Nom du Club",
            phone_placeholder: "Téléphone",
            whatsapp_label: "WhatsApp",
            available: "Disponible",
            name: "Prénom",
            lastname: "Nom",
            email: "Email",
            password: "Mot de passe",
            confirm: "Confirmer",
            recover_title: "Récupérer Mot de Passe",
            recover_desc: "Entrez votre email pour recevoir un lien de récupération.",
            recover_btn: "Envoyer Email",
            recover_sending: "Envoi...",
            google_login: "Continuer avec Google",
            or_email: "Ou avec email",
            loading: "Chargement...",
            register_link: "Inscription Gratuite",
            footer_rights: "© 2025 B5Tools. Développé par l'équipe de développement B5Tools. Tous droits réservés."
        },
        navbar: {
            admin_club: "Gérer le Club",
            my_tournaments: "Mes Tournois",
            broadcast: "Diffuser",
            my_account: "Mon Compte",
            edit_profile: "Modifier Profil",
            quick_game: "Jeu Rapide",
            upgrade_plan: "Améliorer Plan",
            logout: "Déconnexion",
            contact_us: "Besoin d'aide ?"
        }
    },
    de: {
        landing: {
            hero_tag: "Das Tool des Moments",
            hero_title_1: "Bringe dein Spiel",
            hero_title_2: "auf das nächste Level.",
            hero_desc: "Die offizielle Baseball5-Scoring-Plattform. Verwalte Turniere, Statistiken und teile Ergebnisse in Echtzeit mit einer Premium-Oberfläche.",
            cta_start: "Kostenlos Starten",
            login_welcome: "Willkommen",
            login_subtitle: "Melde dich an, um fortzufahren.",
            login_btn: "Anmelden",
            register_title: "Konto Erstellen",
            register_subtitle: "Werde heute Teil von B5Tools.",
            register_btn: "Konto Erstellen",
            forgot_pass: "Passwort vergessen?",
            no_account: "Kein Konto?",
            have_account: "Hast du ein Konto?",
            club_info: "Club-Informationen (Optional)",
            club_name_placeholder: "Clubname",
            phone_placeholder: "Telefon",
            whatsapp_label: "WhatsApp",
            available: "Verfügbar",
            name: "Vorname",
            lastname: "Nachname",
            email: "E-Mail",
            password: "Passwort",
            confirm: "Bestätigen",
            recover_title: "Passwort Wiederherstellen",
            recover_desc: "Gib deine E-Mail ein, um einen Link zur Wiederherstellung zu erhalten.",
            recover_btn: "E-Mail Senden",
            recover_sending: "Sende...",
            google_login: "Weiter mit Google",
            or_email: "Oder mit E-Mail",
            loading: "Laden...",
            register_link: "Kostenlos Registrieren",
            footer_rights: "© 2025 B5Tools. Entwickelt vom B5Tools Development Team. Alle Rechte vorbehalten."
        },
        navbar: {
            admin_club: "Club Verwalten",
            my_tournaments: "Meine Turniere",
            broadcast: "Übertragen",
            my_account: "Mein Konto",
            edit_profile: "Profil Bearbeiten",
            quick_game: "Schnelles Spiel",
            upgrade_plan: "Plan Verbessern",
            logout: "Abmelden",
            contact_us: "Hilfe benötigt?"
        }
    }
};

interface LanguageContextType {
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Load from localStorage or default to 'es'
    const [language, setLanguageState] = useState<LanguageCode>(() => {
        const saved = localStorage.getItem('b5tools_lang');
        return (saved as LanguageCode) || 'es';
    });

    const setLanguage = (lang: LanguageCode) => {
        setLanguageState(lang);
        localStorage.setItem('b5tools_lang', lang);
    };

    // Helper to get nested translation
    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = translations[language];

        for (const k of keys) {
            value = value?.[k];
            if (!value) break;
        }

        return (value as string) || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
