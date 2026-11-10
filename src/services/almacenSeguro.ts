import { SecureStorage } from '@aparajita/capacitor-secure-storage';

// Token guardado en Keystore (Android) / Keychain (iOS), no en localStorage.
// Encapsulado aquí para poder cambiar de plugin sin tocar el resto.
export const almacenSeguro = {
  async get(clave: string): Promise<string | null> {
    const valor = await SecureStorage.get(clave);
    return typeof valor === 'string' ? valor : null;
  },
  async set(clave: string, valor: string): Promise<void> {
    await SecureStorage.set(clave, valor);
  },
  async remove(clave: string): Promise<void> {
    await SecureStorage.remove(clave);
  },
};
