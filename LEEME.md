# Sistema de citas — Real Colegio San José

## 1. Firebase: Firestore + Authentication

1. En Firebase Console, activa **Firestore Database** (modo producción) y **Authentication** (proveedor "Correo electrónico/contraseña").
2. En Firestore → **Reglas**, reemplaza todo por esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function esAdminOPropietario() {
      return request.auth != null &&
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol in ['admin','propietario'];
    }
    function miPersonaId() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.personaId;
    }

    match /citas/{citaId} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasAll(['personaId','categoria','fecha','hora','representante','telefono','estudiante','grado','seccion']);
      allow update: if false;
      allow delete: if request.auth != null && resource.data.personaId == miPersonaId();
    }

    match /bloqueos/{id} {
      allow read: if true;
      allow create: if request.auth != null && request.resource.data.personaId == miPersonaId();
      allow delete: if request.auth != null && resource.data.personaId == miPersonaId();
      allow update: if false;
    }

    match /usuarios/{uid} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == uid;
      allow update: if request.auth != null && (request.auth.uid == uid || esAdminOPropietario());
      allow delete: if esAdminOPropietario();
    }

    match /invitaciones/{id} {
      allow read: if request.auth != null;
      allow create, delete: if esAdminOPropietario();
      allow update: if request.auth != null;
    }

    match /config/propietario {
      allow read: if true;
      allow create: if request.auth != null && !exists(/databases/$(database)/documents/config/propietario);
      allow update: if esAdminOPropietario();
    }

    match /personas/{id} {
      allow read: if true;
      allow create, update, delete: if esAdminOPropietario();
    }

    match /horarios/{personaId} {
      allow read: if true;
      allow write: if request.auth != null && miPersonaId() == personaId;
    }
  }
}
```

3. Publica las reglas.

## 2. Crear al primer propietario (rector)

1. Publica el sitio primero (paso 5 más abajo).
2. Entra UNA sola vez a `tusitio.github.io/setup-propietario.html`, pon el correo y contraseña del rector, y crea la cuenta.
3. Esa página se "autobloquea": si alguien vuelve a entrar después de que ya exista un propietario, no podrá crear otro. Puedes borrar este archivo del repositorio después de usarlo si prefieres, no es obligatorio.

## 3. Cómo se invita al resto del personal

1. El propietario o un administrador entra a `admin.html`, elige el rol (docente, psicólogo, coordinador, o administrador — esto último solo lo puede hacer el propietario), selecciona a qué persona del calendario corresponde, y pone su correo. Clic en "Invitar".
2. La persona invitada entra a `registro.html`, pone ese mismo correo y crea su propia contraseña.
3. Desde ese momento entra en `login.html` con su correo y contraseña.
4. Docentes/psicólogos/coordinador llegan a `mi-cuenta.html` (ahí editan su horario y ven sus citas). Administradores y el propietario llegan a `admin.html`.

## 4. Agregar docentes, psicólogos y coordinador

Ya no se edita ningún archivo de código para esto. Entra a `admin.html` (como propietario o administrador), sección "Docentes, psicólogos y coordinador", y agrégalos ahí. Luego los puedes invitar por correo en la sección de abajo, en la misma página.

## 5. Publicar en GitHub Pages

Sube todos los archivos y carpetas manteniendo la estructura (`css/`, `js/`, `assets/`, y todos los `.html` en la raíz). En Settings → Pages, publica desde `main` / raíz.

## 6. Correo automático al agendar (EmailJS)

1. Crea una cuenta gratis en emailjs.com (hasta 200 correos/mes gratis).
2. En "Email Services", conecta el Gmail/Outlook del colegio.
3. En "Email Templates", crea una plantilla con estos campos:
   - **To email:** `{{to_email}}`
   - **Subject:** `Nueva cita agendada — {{fecha}} {{hora}}`
   - **Content:**
     ```
     Hola {{persona_nombre}},

     Se agendó una nueva cita contigo:

     Fecha: {{fecha}}
     Hora: {{hora}}
     Representante: {{representante}}
     Teléfono: {{telefono}}
     Estudiante: {{estudiante}} ({{grado}} {{seccion}})
     Motivo: {{motivo}}

     — Real Colegio San José
     ```
4. En "Account" → "General", copia tu Public Key. Copia también el Service ID y el Template ID.
5. Abre `js/emailjs-config.js` y reemplaza `TU_PUBLIC_KEY`, `TU_SERVICE_ID` y `TU_TEMPLATE_ID` con esos valores.
6. En `admin.html`, cada docente/psicólogo/coordinador necesita tener su "Correo para notificaciones" puesto para que le llegue el aviso. Si no lo tiene, simplemente no se envía nada (no da error).

Esto es 100% automático: el representante no ve ni el correo ni el teléfono del profesor en ningún momento, todo pasa por detrás.

## 7. Nota sobre seguridad

Con Firebase Authentication, los permisos ya están protegidos por las reglas de Firestore, no solo por la interfaz. Aun así, no le des el rol "propietario" a nadie que no sea el rector, y ten cuidado a quién le compartes el acceso de administrador.

## 8. Novedades de esta versión

- El formulario de citas ahora pide: representante, teléfono, estudiante, grado, sección y motivo.
- `lista.html` tiene un buscador para filtrar docentes/psicólogos por nombre.
- El docente/psicólogo puede hacer clic en una hora marcada como "CITA" (en `mi-cuenta.html`) para ver el detalle completo de quién la agendó.
- El calendario anual de `mi-cuenta.html` ahora te lleva directo a esa semana si haces clic en cualquier día (tenga o no citas).
- Al crear una persona en `admin.html` puedes agregar teléfono y foto (la foto se recorta y ajusta sola a un cuadrado prolijo).
- El mensaje automático por SMS/WhatsApp cuando alguien agenda **todavía no está implementado** — necesita un servicio de pago (ej. Twilio) y un backend aparte.
- Cada docente/psicólogo/coordinador define su propio horario de atención (día, hora exacta de inicio y fin, y duración de cada cita) desde `mi-cuenta.html`. Ya no hay un horario fijo igual para todos.
