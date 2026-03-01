import en from "../locales/en.json";
import bn from "../locales/bn.json";

const translations: any = { en, bn };

export const t = (key: string, lang: string = "bn") => {
    const selectedLang = translations[lang] || translations["bn"];
    return selectedLang[key] || key;
};
