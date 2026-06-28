# BurguerMap

App localizador de carritos de hamburguesas. Construida con React Native (Expo SDK 56) y Supabase.

## Requisitos

- Node.js >= 20 (recomendado 20.19.x)
- JDK 17 (para build local de Android)
- Android Studio (SDK, emulador, y herramientas de build)
- Gradle (incluido con Android Studio)

## Variables de Entorno

Copia `.env.example` a `.env` y completa tus credenciales de Supabase:

```bash
cp .env.example .env
```

## Desarrollo

### Correr con emulador Android

```bash
cd front
pnpm start
```

Esto levanta el servidor Metro en http://localhost:8081. Luego presiona `a` en la terminal para abrir en el emulador Android.

O directamente:

```bash
cd front
pnpm android
```

### Correr con Expo Go (dispositivo físico)

```bash
cd front
pnpm expo start
```

Escanea el código QR con la app Expo Go en tu dispositivo.

## Build Local (APK)

### Prerrequisitos para build local

Asegúrate de tener configurado Android Studio y haber definido la variable de entorno `ANDROID_HOME`:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

Agrega estas líneas a tu `~/.bashrc` o `~/.zshrc` para que persistan.

### Generar APK de desarrollo

```bash
cd front
npx eas build --platform android --profile development --local
```

### Generar APK de producción

```bash
cd front
npx eas build --platform android --profile production --local
```

El `--local` le indica a EAS que compile en tu máquina en vez de enviar el trabajo a los servidores de EAS.

> **Nota:** La primera vez que ejecutes el build local, EAS descargará y configurará el entorno de compilación (Gradle, Android SDK tools, etc.). El APK generado se encontrará en la raíz del proyecto.

## Limpiar build local

```bash
cd front
npx expo customize --android
```

O manualmente borrando la carpeta `android/`:

```bash
rm -rf android/
npx expo prebuild --clean
```
