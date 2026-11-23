import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage } from "zustand/middleware";

// Caché local de los datos del usuario: la app abre al instante con lo último visto
// y la red solo refresca. Se borra al cerrar sesión (authStore).
// shortcut: si la hidratación terminara después del primer fetch, pisaría datos frescos con los
// guardados un instante; AsyncStorage lee mucho antes que la red. Usar merge por timestamp si pasa.
export const cacheStorage = createJSONStorage(() => AsyncStorage);

/** Flag local de onboarding visto: no se borra al cerrar sesión (es del dispositivo, no del usuario). */
export const ONBOARDING_KEY = "onboarding_done";
