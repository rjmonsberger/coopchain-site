# CoopchAIn site · versión ordenada para GitHub + Vercel

## Estructura
- `index.html` → Home institucional
- `dialogar-con-el-libro.html` → Acceso protegido al GPT, preguntas guía y FAQ
- `videos.html` → Videos-resumen del libro y acceso al canal `coopchain_pro`
- `blog.html` → Blog público de ideas y notas
- `registro.html` → Registro único para acceder a Dialogar con el libro y Videos
- `css/styles.css` → Estilos globales compartidos
- `js/main.js` → Lógica simple de registro local y protección demo de rutas
- `images/` → Imágenes válidas del sitio

## Imágenes válidas en `images/`
- `cover.jpg`
- `Pagina 24.jpg`
- `Imagen_Ec-Tecno-Cooperacion_02.png`
- `Calidad de los vinculos.png`
- `Imagen_rodolfo..png`
- `Pagina 130.png`
- `tres_futuros_posibles.png`
- `Imagen blog.png`

## Lógica de acceso
El registro es único y habilita:
- `dialogar-con-el-libro.html`
- `videos.html`

La protección actual es de demostración y usa `localStorage`.

## Qué falta para una versión de producción real
1. backend seguro
2. base de datos de usuarios
3. autenticación real por email
4. OpenAI Responses API
5. File Search + Vector Store
6. persistencia real de conversaciones

## Despliegue
1. Sube todos los archivos al repositorio GitHub
2. Mantén el dominio `coopchain.pro` apuntando a Vercel
3. Cada commit en `main` dispara un redeploy automático
