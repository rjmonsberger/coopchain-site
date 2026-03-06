# CoopchAIn site · listo para GitHub + Vercel

## Estructura
- `index.html` → Home institucional
- `dialogar-con-el-libro.html` → GPT + prompts + glosario
- `videos.html` → Videos del libro
- `blog.html` → Blog inicial
- `registro.html` → Registro único demo
- `css/styles.css` → Estilos globales
- `js/main.js` → Lógica simple de registro local
- `images/` → Imágenes del libro y portada

## Qué hace hoy
- Navega entre páginas
- Aplica estética editorial coherente
- Protege `/videos` y `/dialogar` con un flujo demo usando `localStorage`
- Abre el GPT actual en nueva pestaña

## Qué falta para producción real
1. backend seguro
2. base de datos de usuarios
3. registro real por email
4. OpenAI Responses API
5. File Search + Vector Store
6. persistencia real de conversaciones

## Cómo desplegar
1. Sube todos los archivos a GitHub.
2. En Vercel, conecta el repositorio.
3. Deploy.
4. Mantén `coopchain.pro` apuntando a Vercel.
