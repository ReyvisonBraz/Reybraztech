# Etapa 12 — SEO e Meta Tags (Open Graph)

**Prioridade:** 🟢 Baixa
**Status:** ❌ Pendente
**Depende de:** nada

---

## Contexto

Ao compartilhar o link do site no WhatsApp ou redes sociais, não aparece prévia (imagem, título, descrição). Precisa de meta tags Open Graph no `index.html`.

---

## Arquivos Envolvidos
| Arquivo | Papel |
|---------|-------|
| `index.html` | Adicionar meta tags OG |

---

## O que adicionar no `<head>` do `index.html`

```html
<meta property="og:title" content="Reybraztech" />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://reybraztech.com/og-image.png" />
<meta property="og:url" content="https://reybraztech.com" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```

---

## Critério de Conclusão
- [ ] Compartilhar link no WhatsApp exibe prévia com imagem e título
- [ ] Imagem OG criada (1200x630px recomendado)
