import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import general from "./general";
import alumni from "./alumni";
import admin from "./admin";
import staff from "./staff"


i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          ...general.en.translation,
          ...alumni.en.translation,
          ...admin.en.translation,
          ...staff.en.translation,
        }
      },
      ar: {
        translation: {
          ...general.ar.translation,
          ...alumni.ar.translation,
          ...admin.ar.translation,
          ...staff.ar.translation
        }
      }
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });

export default i18n;
