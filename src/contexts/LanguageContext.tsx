import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'da';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.inventory': 'Inventory',
    'nav.products': 'Products',
    'nav.import': 'Import',
    'nav.orders': 'Orders',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    
    // Common
    'common.search': 'Search',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.loading': 'Loading...',
    
    // Auth
    'auth.signOut': 'Sign out',
    'auth.myAccount': 'My Account',
    
    // Inventory
    'inventory.title': 'Inventory',
    'inventory.quickCount': 'Quick Count Mode',
    'inventory.manageStock': 'Manage your stock levels',
    'inventory.startCount': 'Start Count',
    'inventory.endSession': 'End Session',
    'inventory.confirmCount': 'Confirm Count',
    'inventory.lowStockOnly': 'low stock only',
    'inventory.items': 'items',
    'inventory.noProducts': 'No products found',
    'inventory.adjustFilters': 'Try adjusting your filters',
    'inventory.searchProducts': 'Search products...',
    'inventory.noLocations': 'No locations configured',
    'inventory.noStockLevel': 'No stock level',
    'inventory.openBottle': 'Open bottle level',
    'inventory.par': 'Par',
    'inventory.reorderAt': 'Reorder at',
    
    // Categories
    'category.all': 'All',
    'category.wine': 'Wine',
    'category.beer': 'Beer',
    'category.spirits': 'Spirits',
    'category.coffee': 'Coffee',
    'category.soda': 'Soda',
    'category.syrup': 'Syrup',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.overview': 'Overview',
    'dashboard.lowStock': 'Low Stock Alerts',
    'dashboard.recentActivity': 'Recent Activity',
    
    // Language
    'language.english': 'English',
    'language.danish': 'Dansk',
  },
  da: {
    // Navigation
    'nav.dashboard': 'Oversigt',
    'nav.inventory': 'Lager',
    'nav.products': 'Produkter',
    'nav.import': 'Importer',
    'nav.orders': 'Ordrer',
    'nav.reports': 'Rapporter',
    'nav.settings': 'Indstillinger',
    
    // Common
    'common.search': 'Søg',
    'common.save': 'Gem',
    'common.cancel': 'Annuller',
    'common.confirm': 'Bekræft',
    'common.delete': 'Slet',
    'common.edit': 'Rediger',
    'common.add': 'Tilføj',
    'common.loading': 'Indlæser...',
    
    // Auth
    'auth.signOut': 'Log ud',
    'auth.myAccount': 'Min konto',
    
    // Inventory
    'inventory.title': 'Lager',
    'inventory.quickCount': 'Hurtig optællingstilstand',
    'inventory.manageStock': 'Administrer dine lagerniveauer',
    'inventory.startCount': 'Start optælling',
    'inventory.endSession': 'Afslut session',
    'inventory.confirmCount': 'Bekræft optælling',
    'inventory.lowStockOnly': 'kun lav beholdning',
    'inventory.items': 'varer',
    'inventory.noProducts': 'Ingen produkter fundet',
    'inventory.adjustFilters': 'Prøv at justere dine filtre',
    'inventory.searchProducts': 'Søg produkter...',
    'inventory.noLocations': 'Ingen lokationer konfigureret',
    'inventory.noStockLevel': 'Intet lagerniveau',
    'inventory.openBottle': 'Åben flaskeniveau',
    'inventory.par': 'Par',
    'inventory.reorderAt': 'Genbestil ved',
    
    // Categories
    'category.all': 'Alle',
    'category.wine': 'Vin',
    'category.beer': 'Øl',
    'category.spirits': 'Spiritus',
    'category.coffee': 'Kaffe',
    'category.soda': 'Sodavand',
    'category.syrup': 'Sirup',
    
    // Dashboard
    'dashboard.title': 'Oversigt',
    'dashboard.overview': 'Overblik',
    'dashboard.lowStock': 'Lavt lager advarsler',
    'dashboard.recentActivity': 'Seneste aktivitet',
    
    // Language
    'language.english': 'English',
    'language.danish': 'Dansk',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('pourstock-language');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('pourstock-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
