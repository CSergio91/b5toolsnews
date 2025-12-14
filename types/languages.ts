export type LanguageCode = 'es' | 'en' | 'pt' | 'fr' | 'de';

export interface Translations {
    landing: {
        hero_tag: string;
        hero_title_1: string;
        hero_title_2: string;
        hero_desc: string;
        cta_start: string;
        login_welcome: string;
        login_subtitle: string;
        login_btn: string;
        register_title: string;
        register_subtitle: string;
        register_btn: string;
        forgot_pass: string;
        no_account: string;
        have_account: string;
        club_info: string;
        club_name_placeholder: string;
        phone_placeholder: string;
        whatsapp_label: string;
        available: string;

        // Form Placeholders
        name: string;
        lastname: string;
        email: string;
        password: string;
        confirm: string;

        // Recover & Google
        recover_title: string;
        recover_desc: string;
        recover_btn: string;
        recover_sending: string;
        google_login: string;
        or_email: string;
        loading: string;
        register_link: string;

        // Footer
        footer_rights: string;
    };
    navbar: {
        admin_club: string;
        my_tournaments: string;
        broadcast: string;
        my_account: string;
        edit_profile: string;
        quick_game: string;
        upgrade_plan: string;
        logout: string;
        contact_us: string;
    }
}
