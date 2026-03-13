import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type LocaleCode =
  | 'en' | 'en-GB'
  | 'ar'
  | 'fr' | 'es' | 'de' | 'nl' | 'pt' | 'ca' | 'bar'
  | 'it' | 'el' | 'tr' | 'pl' | 'uk' | 'ro' | 'hu' | 'cs'
  | 'sv'
  | 'sh' | 'sr';

export interface LocaleOption {
  code: LocaleCode;
  name: string;        // Native name
  flag: string;        // Emoji flag
  currency: string;    // Default currency code for this locale
  rtl: boolean;
  numberLocale: string; // BCP-47 locale for Intl.NumberFormat
}

export const localeOptions: LocaleOption[] = [
  // Americas / UK
  { code: 'en',    name: 'English (US)',     flag: '🇺🇸', currency: 'USD', rtl: false, numberLocale: 'en-US' },
  { code: 'en-GB', name: 'English (UK)',     flag: '🇬🇧', currency: 'GBP', rtl: false, numberLocale: 'en-GB' },
  // Middle East
  { code: 'ar',    name: 'العربية',          flag: '🇦🇪', currency: 'AED', rtl: true,  numberLocale: 'ar-AE' },
  // Western Europe
  { code: 'fr',    name: 'Français',         flag: '🇫🇷', currency: 'EUR', rtl: false, numberLocale: 'fr-FR' },
  { code: 'es',    name: 'Español',          flag: '🇪🇸', currency: 'EUR', rtl: false, numberLocale: 'es-ES' },
  { code: 'de',    name: 'Deutsch',          flag: '🇩🇪', currency: 'EUR', rtl: false, numberLocale: 'de-DE' },
  { code: 'nl',    name: 'Nederlands',       flag: '🇳🇱', currency: 'EUR', rtl: false, numberLocale: 'nl-NL' },
  { code: 'pt',    name: 'Português',        flag: '🇵🇹', currency: 'EUR', rtl: false, numberLocale: 'pt-PT' },
  { code: 'ca',    name: 'Català',           flag: '🏴󠁥󠁳󠁣󠁴󠁿', currency: 'EUR', rtl: false, numberLocale: 'ca-ES' },
  { code: 'bar',   name: 'Boarisch',         flag: '🇩🇪', currency: 'EUR', rtl: false, numberLocale: 'de-DE' },
  // Southern / Eastern Europe
  { code: 'it',    name: 'Italiano',         flag: '🇮🇹', currency: 'EUR', rtl: false, numberLocale: 'it-IT' },
  { code: 'el',    name: 'Ελληνικά',         flag: '🇬🇷', currency: 'EUR', rtl: false, numberLocale: 'el-GR' },
  { code: 'tr',    name: 'Türkçe',           flag: '🇹🇷', currency: 'TRY', rtl: false, numberLocale: 'tr-TR' },
  { code: 'pl',    name: 'Polski',           flag: '🇵🇱', currency: 'PLN', rtl: false, numberLocale: 'pl-PL' },
  { code: 'uk',    name: 'Українська',       flag: '🇺🇦', currency: 'UAH', rtl: false, numberLocale: 'uk-UA' },
  { code: 'ro',    name: 'Română',           flag: '🇷🇴', currency: 'RON', rtl: false, numberLocale: 'ro-RO' },
  { code: 'hu',    name: 'Magyar',           flag: '🇭🇺', currency: 'HUF', rtl: false, numberLocale: 'hu-HU' },
  { code: 'cs',    name: 'Čeština',          flag: '🇨🇿', currency: 'CZK', rtl: false, numberLocale: 'cs-CZ' },
  // Northern Europe
  { code: 'sv',    name: 'Svenska',          flag: '🇸🇪', currency: 'SEK', rtl: false, numberLocale: 'sv-SE' },
  // Balkans
  { code: 'sh',    name: 'Srpskohrvatski',   flag: '🇧🇦', currency: 'EUR', rtl: false, numberLocale: 'hr-HR' },
  { code: 'sr',    name: 'Srpski',           flag: '🇷🇸', currency: 'RSD', rtl: false, numberLocale: 'sr-RS' },
];

// ── Translations ──────────────────────────────────────────────────────────────
const translations: Record<string, Record<string, string>> = {
  en: {
    home: 'Home', dashboard: 'Dashboard', trading: 'Trading', kyc: 'KYC Verification',
    deposit: 'Deposit', withdraw: 'Withdraw', swap: 'Coin Swapper', admin: 'Admin Panel',
    login: 'Login', signup: 'Sign Up', logout: 'Logout', email: 'Email', password: 'Password',
    totalAssets: 'Total Assets', recentTransactions: 'Recent Transactions', trade: 'Trade',
    submit: 'Submit', cancel: 'Cancel', approve: 'Approve', reject: 'Reject',
    pending: 'Pending', approved: 'Approved', rejected: 'Rejected', features: 'Features',
    whyChoose: 'Why Choose Vantix', howItWorks: 'How It Works', faq: 'FAQ',
    getStarted: 'Get Started', welcome: 'Welcome to Vantix', tagline: 'The Future of Crypto Trading',
    selectLanguage: 'Language & Region',
  },
  'en-GB': {
    home: 'Home', dashboard: 'Dashboard', trading: 'Trading', kyc: 'KYC Verification',
    deposit: 'Deposit', withdraw: 'Withdraw', swap: 'Coin Swapper', admin: 'Admin Panel',
    login: 'Login', signup: 'Sign Up', logout: 'Logout', email: 'Email', password: 'Password',
    totalAssets: 'Total Assets', recentTransactions: 'Recent Transactions', trade: 'Trade',
    submit: 'Submit', cancel: 'Cancel', approve: 'Approve', reject: 'Reject',
    pending: 'Pending', approved: 'Approved', rejected: 'Rejected', features: 'Features',
    whyChoose: 'Why Choose Vantix', howItWorks: 'How It Works', faq: 'FAQ',
    getStarted: 'Get Started', welcome: 'Welcome to Vantix', tagline: 'The Future of Crypto Trading',
    selectLanguage: 'Language & Region',
  },
  ar: {
    home: 'الرئيسية', dashboard: 'لوحة التحكم', trading: 'التداول', kyc: 'التحقق من الهوية',
    deposit: 'إيداع', withdraw: 'سحب', swap: 'تبادل العملات', admin: 'لوحة الإدارة',
    login: 'تسجيل الدخول', signup: 'إنشاء حساب', logout: 'تسجيل الخروج',
    email: 'البريد الإلكتروني', password: 'كلمة المرور',
    totalAssets: 'إجمالي الأصول', recentTransactions: 'المعاملات الأخيرة', trade: 'تداول',
    submit: 'إرسال', cancel: 'إلغاء', approve: 'موافقة', reject: 'رفض',
    pending: 'قيد الانتظار', approved: 'تمت الموافقة', rejected: 'مرفوض', features: 'الميزات',
    whyChoose: 'لماذا تختار Vantix', howItWorks: 'كيف يعمل', faq: 'الأسئلة الشائعة',
    getStarted: 'ابدأ الآن', welcome: 'مرحباً بك في Vantix', tagline: 'مستقبل تداول العملات الرقمية',
    selectLanguage: 'اللغة والمنطقة',
  },
  fr: {
    home: 'Accueil', dashboard: 'Tableau de Bord', trading: 'Trading', kyc: 'Vérification KYC',
    deposit: 'Dépôt', withdraw: 'Retrait', swap: 'Échange', admin: 'Panneau Admin',
    login: 'Connexion', signup: 'Inscription', logout: 'Déconnexion', email: 'Email', password: 'Mot de Passe',
    totalAssets: 'Actifs Totaux', recentTransactions: 'Transactions Récentes', trade: 'Trader',
    submit: 'Soumettre', cancel: 'Annuler', approve: 'Approuver', reject: 'Rejeter',
    pending: 'En Attente', approved: 'Approuvé', rejected: 'Rejeté', features: 'Fonctionnalités',
    whyChoose: 'Pourquoi Choisir Vantix', howItWorks: 'Comment Ça Marche', faq: 'FAQ',
    getStarted: 'Commencer', welcome: 'Bienvenue sur Vantix', tagline: "L'Avenir du Trading Crypto",
    selectLanguage: 'Langue & Région',
  },
  es: {
    home: 'Inicio', dashboard: 'Panel', trading: 'Comercio', kyc: 'Verificación KYC',
    deposit: 'Depósito', withdraw: 'Retirar', swap: 'Intercambio', admin: 'Panel de Administración',
    login: 'Iniciar Sesión', signup: 'Registrarse', logout: 'Cerrar Sesión',
    email: 'Correo Electrónico', password: 'Contraseña',
    totalAssets: 'Activos Totales', recentTransactions: 'Transacciones Recientes', trade: 'Comerciar',
    submit: 'Enviar', cancel: 'Cancelar', approve: 'Aprobar', reject: 'Rechazar',
    pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado', features: 'Características',
    whyChoose: 'Por Qué Elegir Vantix', howItWorks: 'Cómo Funciona', faq: 'Preguntas Frecuentes',
    getStarted: 'Comenzar', welcome: 'Bienvenido a Vantix', tagline: 'El Futuro del Comercio de Criptomonedas',
    selectLanguage: 'Idioma y Región',
  },
  de: {
    home: 'Startseite', dashboard: 'Dashboard', trading: 'Handel', kyc: 'KYC-Verifizierung',
    deposit: 'Einzahlung', withdraw: 'Abheben', swap: 'Tausch', admin: 'Admin-Panel',
    login: 'Anmelden', signup: 'Registrieren', logout: 'Abmelden', email: 'E-Mail', password: 'Passwort',
    totalAssets: 'Gesamtvermögen', recentTransactions: 'Letzte Transaktionen', trade: 'Handeln',
    submit: 'Einreichen', cancel: 'Abbrechen', approve: 'Genehmigen', reject: 'Ablehnen',
    pending: 'Ausstehend', approved: 'Genehmigt', rejected: 'Abgelehnt', features: 'Funktionen',
    whyChoose: 'Warum Vantix', howItWorks: 'Wie Es Funktioniert', faq: 'FAQ',
    getStarted: 'Loslegen', welcome: 'Willkommen bei Vantix', tagline: 'Die Zukunft des Krypto-Handels',
    selectLanguage: 'Sprache & Region',
  },
  nl: {
    home: 'Home', dashboard: 'Dashboard', trading: 'Handelen', kyc: 'KYC Verificatie',
    deposit: 'Storting', withdraw: 'Opname', swap: 'Ruilen', admin: 'Admin Paneel',
    login: 'Inloggen', signup: 'Aanmelden', logout: 'Uitloggen', email: 'Email', password: 'Wachtwoord',
    totalAssets: 'Totale Activa', recentTransactions: 'Recente Transacties', trade: 'Handelen',
    submit: 'Indienen', cancel: 'Annuleren', approve: 'Goedkeuren', reject: 'Afwijzen',
    pending: 'In Behandeling', approved: 'Goedgekeurd', rejected: 'Afgewezen', features: 'Kenmerken',
    whyChoose: 'Waarom Vantix', howItWorks: 'Hoe Het Werkt', faq: 'FAQ',
    getStarted: 'Aan De Slag', welcome: 'Welkom bij Vantix', tagline: 'De Toekomst van Crypto Handelen',
    selectLanguage: 'Taal & Regio',
  },
  pt: {
    home: 'Início', dashboard: 'Painel', trading: 'Negociação', kyc: 'Verificação KYC',
    deposit: 'Depósito', withdraw: 'Levantar', swap: 'Troca', admin: 'Painel Admin',
    login: 'Entrar', signup: 'Registar', logout: 'Sair', email: 'Email', password: 'Senha',
    totalAssets: 'Total de Activos', recentTransactions: 'Transações Recentes', trade: 'Negociar',
    submit: 'Enviar', cancel: 'Cancelar', approve: 'Aprovar', reject: 'Rejeitar',
    pending: 'Pendente', approved: 'Aprovado', rejected: 'Rejeitado', features: 'Funcionalidades',
    whyChoose: 'Porquê Escolher Vantix', howItWorks: 'Como Funciona', faq: 'FAQ',
    getStarted: 'Começar', welcome: 'Bem-vindo ao Vantix', tagline: 'O Futuro do Trading de Cripto',
    selectLanguage: 'Idioma e Região',
  },
  ca: {
    home: 'Inici', dashboard: 'Tauler', trading: 'Comerç', kyc: 'Verificació KYC',
    deposit: 'Dipòsit', withdraw: 'Retirar', swap: 'Intercanvi', admin: 'Tauler Admin',
    login: 'Iniciar Sessió', signup: 'Registrar-se', logout: 'Tancar Sessió', email: 'Correu', password: 'Contrasenya',
    totalAssets: 'Actius Totals', recentTransactions: 'Transaccions Recents', trade: 'Comerciar',
    submit: 'Enviar', cancel: 'Cancel·lar', approve: 'Aprovar', reject: 'Rebutjar',
    pending: 'Pendent', approved: 'Aprovat', rejected: 'Rebutjat', features: 'Característiques',
    whyChoose: 'Per Què Triar Vantix', howItWorks: 'Com Funciona', faq: 'PMF',
    getStarted: 'Comença', welcome: 'Benvingut a Vantix', tagline: 'El Futur del Trading de Cripto',
    selectLanguage: 'Idioma i Regió',
  },
  bar: {
    home: 'Hoam', dashboard: 'Kontrollpaneal', trading: 'Handel', kyc: 'KYC-Prüfung',
    deposit: 'Einzahlung', withdraw: 'Abheben', swap: 'Tausch', admin: 'Admin-Paneal',
    login: 'Oameiden', signup: 'Registrieren', logout: 'Abmelden', email: 'E-Mail', password: 'Passwort',
    totalAssets: 'Gesamtvermögen', recentTransactions: 'Letzte Umsätz', trade: 'Handeln',
    submit: 'Einreichen', cancel: 'Abbrechen', approve: 'Genehmigen', reject: 'Ablehnen',
    pending: 'Ausstehend', approved: 'Genehmigt', rejected: 'Abgelehnt', features: 'Funktionen',
    whyChoose: 'Warum Vantix', howItWorks: "Wia's funktioniert", faq: 'FAQ',
    getStarted: 'Loslegen', welcome: 'Willkommen bei Vantix', tagline: 'De Zukunft vom Krypto-Handel',
    selectLanguage: 'Sproach & Region',
  },
  it: {
    home: 'Home', dashboard: 'Pannello', trading: 'Trading', kyc: 'Verifica KYC',
    deposit: 'Deposito', withdraw: 'Prelievo', swap: 'Scambio', admin: 'Pannello Admin',
    login: 'Accedi', signup: 'Registrati', logout: 'Esci', email: 'Email', password: 'Password',
    totalAssets: 'Totale Asset', recentTransactions: 'Transazioni Recenti', trade: 'Commercia',
    submit: 'Invia', cancel: 'Annulla', approve: 'Approva', reject: 'Rifiuta',
    pending: 'In Attesa', approved: 'Approvato', rejected: 'Rifiutato', features: 'Caratteristiche',
    whyChoose: 'Perché Scegliere Vantix', howItWorks: 'Come Funziona', faq: 'FAQ',
    getStarted: 'Inizia', welcome: 'Benvenuto su Vantix', tagline: 'Il Futuro del Trading Crypto',
    selectLanguage: 'Lingua e Regione',
  },
  el: {
    home: 'Αρχική', dashboard: 'Πίνακας', trading: 'Διαπραγμάτευση', kyc: 'Επαλήθευση KYC',
    deposit: 'Κατάθεση', withdraw: 'Ανάληψη', swap: 'Ανταλλαγή', admin: 'Πίνακας Διαχείρισης',
    login: 'Σύνδεση', signup: 'Εγγραφή', logout: 'Αποσύνδεση', email: 'Email', password: 'Κωδικός',
    totalAssets: 'Συνολικά Περιουσιακά', recentTransactions: 'Πρόσφατες Συναλλαγές', trade: 'Διαπραγμάτευση',
    submit: 'Υποβολή', cancel: 'Ακύρωση', approve: 'Έγκριση', reject: 'Απόρριψη',
    pending: 'Σε Αναμονή', approved: 'Εγκρίθηκε', rejected: 'Απορρίφθηκε', features: 'Χαρακτηριστικά',
    whyChoose: 'Γιατί Vantix', howItWorks: 'Πώς Λειτουργεί', faq: 'Συχνές Ερωτήσεις',
    getStarted: 'Ξεκινήστε', welcome: 'Καλωσήρθατε στο Vantix', tagline: 'Το Μέλλον του Crypto Trading',
    selectLanguage: 'Γλώσσα & Περιοχή',
  },
  tr: {
    home: 'Ana Sayfa', dashboard: 'Kontrol Paneli', trading: 'Ticaret', kyc: 'KYC Doğrulama',
    deposit: 'Para Yatırma', withdraw: 'Para Çekme', swap: 'Takas', admin: 'Yönetici Paneli',
    login: 'Giriş Yap', signup: 'Kayıt Ol', logout: 'Çıkış Yap', email: 'E-posta', password: 'Şifre',
    totalAssets: 'Toplam Varlıklar', recentTransactions: 'Son İşlemler', trade: 'Ticaret Yap',
    submit: 'Gönder', cancel: 'İptal', approve: 'Onayla', reject: 'Reddet',
    pending: 'Beklemede', approved: 'Onaylandı', rejected: 'Reddedildi', features: 'Özellikler',
    whyChoose: 'Neden Vantix', howItWorks: 'Nasıl Çalışır', faq: 'SSS',
    getStarted: 'Başla', welcome: "Vantix'e Hoş Geldiniz", tagline: 'Kripto Ticaretin Geleceği',
    selectLanguage: 'Dil ve Bölge',
  },
  pl: {
    home: 'Strona Główna', dashboard: 'Panel', trading: 'Handel', kyc: 'Weryfikacja KYC',
    deposit: 'Wpłata', withdraw: 'Wypłata', swap: 'Wymiana', admin: 'Panel Admina',
    login: 'Zaloguj', signup: 'Zarejestruj', logout: 'Wyloguj', email: 'Email', password: 'Hasło',
    totalAssets: 'Łączne Aktywa', recentTransactions: 'Ostatnie Transakcje', trade: 'Handel',
    submit: 'Wyślij', cancel: 'Anuluj', approve: 'Zatwierdź', reject: 'Odrzuć',
    pending: 'Oczekujące', approved: 'Zatwierdzone', rejected: 'Odrzucone', features: 'Funkcje',
    whyChoose: 'Dlaczego Vantix', howItWorks: 'Jak To Działa', faq: 'FAQ',
    getStarted: 'Rozpocznij', welcome: 'Witamy w Vantix', tagline: 'Przyszłość Handlu Krypto',
    selectLanguage: 'Język i Region',
  },
  uk: {
    home: 'Головна', dashboard: 'Панель', trading: 'Торгівля', kyc: 'KYC Верифікація',
    deposit: 'Депозит', withdraw: 'Виведення', swap: 'Обмін', admin: 'Адмін Панель',
    login: 'Увійти', signup: 'Реєстрація', logout: 'Вийти',
    email: 'Електронна Пошта', password: 'Пароль',
    totalAssets: 'Загальні Активи', recentTransactions: 'Останні Транзакції', trade: 'Торгувати',
    submit: 'Надіслати', cancel: 'Скасувати', approve: 'Схвалити', reject: 'Відхилити',
    pending: 'Очікування', approved: 'Схвалено', rejected: 'Відхилено', features: 'Можливості',
    whyChoose: 'Чому Vantix', howItWorks: 'Як Це Працює', faq: 'Питання',
    getStarted: 'Почати', welcome: 'Ласкаво просимо до Vantix', tagline: 'Майбутнє Крипто Торгівлі',
    selectLanguage: 'Мова та Регіон',
  },
  ro: {
    home: 'Acasă', dashboard: 'Panou', trading: 'Tranzacționare', kyc: 'Verificare KYC',
    deposit: 'Depozit', withdraw: 'Retragere', swap: 'Schimb', admin: 'Panou Admin',
    login: 'Autentificare', signup: 'Înregistrare', logout: 'Deconectare', email: 'Email', password: 'Parolă',
    totalAssets: 'Active Totale', recentTransactions: 'Tranzacții Recente', trade: 'Tranzacționează',
    submit: 'Trimite', cancel: 'Anulează', approve: 'Aprobă', reject: 'Respinge',
    pending: 'În Așteptare', approved: 'Aprobat', rejected: 'Respins', features: 'Caracteristici',
    whyChoose: 'De Ce Vantix', howItWorks: 'Cum Funcționează', faq: 'Întrebări Frecvente',
    getStarted: 'Începe', welcome: 'Bun venit la Vantix', tagline: 'Viitorul Tranzacționării Crypto',
    selectLanguage: 'Limbă și Regiune',
  },
  hu: {
    home: 'Főoldal', dashboard: 'Irányítópult', trading: 'Kereskedés', kyc: 'KYC Ellenőrzés',
    deposit: 'Befizetés', withdraw: 'Kifizetés', swap: 'Csere', admin: 'Admin Panel',
    login: 'Bejelentkezés', signup: 'Regisztráció', logout: 'Kijelentkezés', email: 'Email', password: 'Jelszó',
    totalAssets: 'Összes Eszköz', recentTransactions: 'Legutóbbi Tranzakciók', trade: 'Kereskedj',
    submit: 'Küldés', cancel: 'Mégse', approve: 'Jóváhagyás', reject: 'Elutasítás',
    pending: 'Függőben', approved: 'Jóváhagyva', rejected: 'Elutasítva', features: 'Funkciók',
    whyChoose: 'Miért Vantix', howItWorks: 'Hogyan Működik', faq: 'GYIK',
    getStarted: 'Kezdés', welcome: 'Üdvözlünk a Vantixban', tagline: 'A Kripto Kereskedés Jövője',
    selectLanguage: 'Nyelv és Régió',
  },
  cs: {
    home: 'Domů', dashboard: 'Přehled', trading: 'Obchodování', kyc: 'KYC Ověření',
    deposit: 'Vklad', withdraw: 'Výběr', swap: 'Výměna', admin: 'Admin Panel',
    login: 'Přihlásit', signup: 'Registrovat', logout: 'Odhlásit', email: 'Email', password: 'Heslo',
    totalAssets: 'Celková Aktiva', recentTransactions: 'Nedávné Transakce', trade: 'Obchodovat',
    submit: 'Odeslat', cancel: 'Zrušit', approve: 'Schválit', reject: 'Zamítnout',
    pending: 'Čeká', approved: 'Schváleno', rejected: 'Zamítnuto', features: 'Funkce',
    whyChoose: 'Proč Vantix', howItWorks: 'Jak To Funguje', faq: 'FAQ',
    getStarted: 'Začít', welcome: 'Vítejte ve Vantixu', tagline: 'Budoucnost Krypto Obchodování',
    selectLanguage: 'Jazyk a Region',
  },
  sv: {
    home: 'Hem', dashboard: 'Instrumentpanel', trading: 'Handel', kyc: 'KYC-Verifiering',
    deposit: 'Insättning', withdraw: 'Uttag', swap: 'Växling', admin: 'Admin Panel',
    login: 'Logga In', signup: 'Registrera', logout: 'Logga Ut', email: 'E-post', password: 'Lösenord',
    totalAssets: 'Totala Tillgångar', recentTransactions: 'Senaste Transaktioner', trade: 'Handla',
    submit: 'Skicka', cancel: 'Avbryt', approve: 'Godkänn', reject: 'Avvisa',
    pending: 'Väntande', approved: 'Godkänd', rejected: 'Avvisad', features: 'Funktioner',
    whyChoose: 'Varför Vantix', howItWorks: 'Hur Det Fungerar', faq: 'FAQ',
    getStarted: 'Kom Igång', welcome: 'Välkommen till Vantix', tagline: 'Framtiden för Kryptohandel',
    selectLanguage: 'Språk och Region',
  },
  sh: {
    home: 'Početna', dashboard: 'Nadzorna ploča', trading: 'Trgovanje', kyc: 'KYC Provjera',
    deposit: 'Uplata', withdraw: 'Isplata', swap: 'Razmjena', admin: 'Admin Panel',
    login: 'Prijava', signup: 'Registracija', logout: 'Odjava', email: 'Email', password: 'Lozinka',
    totalAssets: 'Ukupna Imovina', recentTransactions: 'Nedavne Transakcije', trade: 'Trguj',
    submit: 'Pošalji', cancel: 'Otkaži', approve: 'Odobri', reject: 'Odbij',
    pending: 'Na Čekanju', approved: 'Odobreno', rejected: 'Odbijeno', features: 'Karakteristike',
    whyChoose: 'Zašto Vantix', howItWorks: 'Kako Funkcioniše', faq: 'FAQ',
    getStarted: 'Počni', welcome: 'Dobrodošli u Vantix', tagline: 'Budućnost Kripto Trgovanja',
    selectLanguage: 'Jezik i Regija',
  },
  sr: {
    home: 'Почетна', dashboard: 'Контролна табла', trading: 'Трговање', kyc: 'KYC Верификација',
    deposit: 'Уплата', withdraw: 'Исплата', swap: 'Размена', admin: 'Админ Панел',
    login: 'Пријава', signup: 'Регистрација', logout: 'Одјава', email: 'Имејл', password: 'Лозинка',
    totalAssets: 'Укупна Имовина', recentTransactions: 'Недавне Трансакције', trade: 'Тргуј',
    submit: 'Пошаљи', cancel: 'Откажи', approve: 'Одобри', reject: 'Одбиј',
    pending: 'На Чекању', approved: 'Одобрено', rejected: 'Одбијено', features: 'Карактеристике',
    whyChoose: 'Зашто Vantix', howItWorks: 'Kako Funkcioniše', faq: 'FAQ',
    getStarted: 'Почни', welcome: 'Добродошли у Vantix', tagline: 'Будућност Крипто Трговања',
    selectLanguage: 'Jezik i Regija',
  },
};

// ── Context ───────────────────────────────────────────────────────────────────
interface LanguageContextType {
  locale: LocaleOption;
  setLocale: (code: LocaleCode) => void;
  t: (key: string) => string;
  isRTL: boolean;
  // Legacy compatibility
  language: string;
  setLanguage: (code: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'vantix_locale';

function getInitialLocale(): LocaleOption {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = localeOptions.find(l => l.code === saved);
      if (found) return found;
    }
  } catch { /* ignore */ }
  return localeOptions[0]; // default: en / USD
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleOption>(getInitialLocale);

  const setLocale = (code: LocaleCode) => {
    const found = localeOptions.find(l => l.code === code);
    if (!found) return;
    setLocaleState(found);
    try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
  };

  const t = (key: string): string =>
    translations[locale.code]?.[key] ?? translations['en']?.[key] ?? key;

  // RTL: set html dir
  useEffect(() => {
    document.documentElement.setAttribute('dir', locale.rtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', locale.code);
  }, [locale.code, locale.rtl]);

  const value: LanguageContextType = {
    locale,
    setLocale,
    t,
    isRTL: locale.rtl,
    // legacy
    language: locale.code,
    setLanguage: (code: string) => setLocale(code as LocaleCode),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}

// Legacy export — keep for backwards-compat
export const languageOptions = localeOptions.map(l => ({ code: l.code, name: l.name }));
