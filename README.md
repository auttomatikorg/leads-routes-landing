# Lead Routes

Landing de Lead Routes migrada a Angular.

## Desarrollo

```bash
npm install
npm start
```

La aplicación estará disponible en `http://localhost:4200/`.

## Compilación

```bash
npm run build
```

El resultado se genera en `dist/leads-routes-landing/browser/`.

El contenido de la página está en `src/app/app.html`, los estilos en `src/styles.css` y la captura de la bandeja en `public/app/`.

Los botones de contacto abren un formulario que envía un `POST` JSON a
`https://n8n.innovalaus.com/webhook/lead-routes-landing`. El cuerpo incluye
`nombre_contacto`, `nif`, `correo`, `telefono` e `interes`.
El webhook permite CORS desde `https://leadsroutes.com`. `npm start` utiliza
`proxy.conf.json` para que el formulario funcione también en desarrollo local.
Otros dominios de producción necesitarán estar autorizados en el webhook.
