// Interface strings. Content (explanations) is English for v1; names of
// operations, pages and parameters exist in both languages and switch with the UI.
import { store } from './util.js';

const strings = {
  en: {
    learn: 'Learn', search: 'Search', fix: 'Fix a problem', fixShort: 'Fix', tools: 'Tools', saved: 'Saved',
    searchPlaceholder: 'Search operations, parameters, problems, G-codes…',
    version: 'Version', product: 'Product', operations: 'Operations',
    feeds: 'Speeds & feeds', gcode: 'G-code explainer', glossary: 'Glossary', about: 'About & versions',
    whatItDoes: 'What it does', whenToChange: 'When to change it', mistakes: 'Common mistakes',
    useFor: 'Use it for', avoid: 'Better choice when…', chaining: 'Chaining',
    al: 'Aluminium', steel: 'Steel', ti: 'Titanium', typical: 'Typical',
    bookmark: 'Save', bookmarked: 'Saved', note: 'Note', addNote: 'Add a note', copyLink: 'Copy link',
    verified: 'Checked in my Mastercam', markVerified: 'Mark as checked', notVerified: 'Not checked yet',
    verifyText: 'Written from Mastercam knowledge, not yet compared field by field with a 2025 install. Check it on your machine and mark the page as checked.',
    noResults: 'No match. Try the French name, a G-code, or a problem like "chatter".',
    linkCopied: 'Link copied', savedToast: 'Saved', removedToast: 'Removed from saved',
    newIn: 'New in',
  },
  fr: {
    learn: 'Apprendre', search: 'Rechercher', fix: 'Résoudre un problème', fixShort: 'Dépanner', tools: 'Outils', saved: 'Favoris',
    searchPlaceholder: 'Rechercher opérations, paramètres, problèmes, codes G…',
    version: 'Version', product: 'Produit', operations: 'Opérations',
    feeds: 'Vitesses & avances', gcode: 'Lecteur de code G', glossary: 'Glossaire', about: 'À propos & versions',
    whatItDoes: 'Ce que ça fait', whenToChange: 'Quand le changer', mistakes: 'Erreurs fréquentes',
    useFor: 'À utiliser pour', avoid: 'Meilleur choix quand…', chaining: 'Chaînage',
    al: 'Aluminium', steel: 'Acier', ti: 'Titane', typical: 'Valeur type',
    bookmark: 'Garder', bookmarked: 'Gardé', note: 'Note', addNote: 'Ajouter une note', copyLink: 'Copier le lien',
    verified: 'Vérifié dans mon Mastercam', markVerified: 'Marquer comme vérifié', notVerified: 'Pas encore vérifié',
    verifyText: 'Rédigé à partir de la connaissance de Mastercam, pas encore comparé champ par champ avec une installation 2025. Vérifiez sur votre poste et marquez la page comme vérifiée.',
    noResults: 'Aucun résultat. Essayez le nom anglais, un code G ou un problème comme « broutage ».',
    linkCopied: 'Lien copié', savedToast: 'Gardé', removedToast: 'Retiré des favoris',
    newIn: 'Nouveau en',
  },
};

// English only for now; French UI strings are kept for a later release.
let lang = 'en';
export const getLang = () => lang;
export const setLang = (l) => { lang = l; store.set('lang', l); document.documentElement.lang = l; };
export const t = (k) => strings[lang][k] ?? strings.en[k] ?? k;
// Name of an item in the current language (operations, pages, params all have name + fr).
export const nm = (o) => (lang === 'fr' && o.fr ? o.fr : o.name);
// The other-language name, shown small under the main one.
export const alt = (o) => (lang === 'fr' ? o.name : o.fr);
document.documentElement.lang = lang;
