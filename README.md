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
`nombre_contacto`, `nif`, `correo`, `telefono`, `interes` y
`acepta_newsletter` (booleano, `false` si no se marca la casilla) y
`acepta_politica_y_terminos` (booleano; aceptación obligatoria).
El webhook permite CORS desde `https://leadsroutes.com`. `npm start` utiliza
`proxy.conf.json` para que el formulario funcione también en desarrollo local.
Otros dominios de producción necesitarán estar autorizados en el webhook.

Las páginas legales de esta landing están en `public/politica-privacidad.html` y
`public/terminos-y-condiciones.html`. Identifican a INNOVALAUS SL (NIF
B67146357) como titular y responsable del tratamiento.
