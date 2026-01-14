# 📧 Configuración de Envío de Correos

## Opción 1: Ethereal Email (Recomendado para Testing)
**Gratis, sin registro, correos visibles en web**

En `.env`:
```env
SMTP_SERVICE=ethereal
```

✅ Ventajas:
- No requiere cuenta
- Crea credenciales automáticamente
- Te muestra URL para ver el correo en navegador
- Perfecto para desarrollo

## Opción 2: Gmail con Contraseña de Aplicación
**Requiere contraseña especial de Google**

1. Ve a https://myaccount.google.com/apppasswords
2. Crea una contraseña para "Correo"
3. Copia la contraseña de 16 caracteres

En `.env`:
```env
SMTP_SERVICE=gmail
SMTP_USER=tucorreo@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # Sin espacios
SMTP_FROM=tucorreo@gmail.com
```

## Opción 3: SendGrid (Gratis hasta 100/día)
**Servicio profesional, ideal para producción**

1. Regístrate en https://sendgrid.com
2. Crea una API Key
3. Verifica tu dominio o correo

En `.env`:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=TU_API_KEY_DE_SENDGRID
SMTP_FROM=tucorreo@verificado.com
```

## Opción 4: Mailgun (Gratis para testing)
**Alternativa a SendGrid**

1. Regístrate en https://www.mailgun.com
2. Obtén tus credenciales SMTP

En `.env`:
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@tu-dominio.mailgun.org
SMTP_PASS=tu_password_mailgun
SMTP_FROM=noreply@tudominio.com
```

## Opción 5: Resend (Moderno y simple)
**100 correos/día gratis, muy fácil de usar**

1. Regístrate en https://resend.com
2. Crea una API Key

En `.env`:
```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=re_TU_API_KEY
SMTP_FROM=onboarding@resend.dev
```

## Modo Sin Correo (Solo Consola)
**Para desarrollo rápido**

En `.env`:
```env
# No configurar SMTP_* o comentarlos
# SMTP_SERVICE=
```

El código aparecerá solo en la consola del backend.

---

## 🚀 Recomendación

- **Desarrollo local**: Opción 1 (Ethereal)
- **Producción pequeña**: Opción 3 (SendGrid) u Opción 5 (Resend)
- **Solo testing rápido**: Sin configuración (consola)
