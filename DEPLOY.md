# 🚀 Guia de Deploy Seguro

## Opção 1: GitHub Actions (Automático) ✅ RECOMENDADO

### Configuração Inicial (uma vez):

1. **No GitHub, vá em:** Settings → Secrets and variables → Actions
2. **Crie um secret:**
   - Nome: `APPS_SCRIPT_URL`
   - Valor: `AKfycbz6-4fB_mcsr0gZKpyZQsqoGUCjwGFoAsJl-c1cm3nNEX8Wsav5x0z13tdvM-s8QFJT`
3. **Ative GitHub Pages:**
   - Settings → Pages
   - Source: **GitHub Actions**

### Deploy Automático:

Cada vez que você fizer push para `main`, o GitHub Actions:

- ✅ Cria `config.js` a partir do template
- ✅ Injeta a URL do secret
- ✅ Publica no GitHub Pages

```powershell
git add .
git commit -m "Update"
git push
# Deploy automático acontece!
```

---

## Opção 2: Branch Separada para Deploy

Mantenha duas branches:

```powershell
# Branch main: código sem config.js (para GitHub)
git checkout main
git add .
git commit -m "Update source"
git push origin main

# Branch gh-pages: código com config.js (para deploy)
git checkout gh-pages
Copy-Item js\config.js.template js\config.js
# Edite config.js com URL real
git add .
git commit -m "Deploy"
git push origin gh-pages
```

**No GitHub Pages:** Settings → Pages → Source: **gh-pages** branch

---

## Opção 3: Deploy Manual Local

Use um script para gerar versão de deploy:

**Script PowerShell (`deploy.ps1`):**

```powershell
# Criar pasta de deploy
New-Item -ItemType Directory -Force deploy | Out-Null

# Copiar arquivos
Copy-Item -Recurse css, js, appscript, *.html, LICENSE deploy/

# Criar config.js real na pasta deploy
$apiUrl = "sua-url-completa-aqui"
(Get-Content js/config.js.template) -replace 'SEU_SCRIPT_ID_AQUI', $apiUrl |
    Set-Content deploy/js/config.js

Write-Host "✅ Deploy pronto em ./deploy/"
Write-Host "Suba apenas a pasta deploy/ para seu servidor"
```

---

## Opção 4: Variável de Ambiente Runtime (Avançado)

Buscar a URL em runtime de uma API sua:

**`js/config.js` (versão pública):**

```javascript
const CONFIG = {
  API_URL: null, // Será preenchido em runtime
  // ... resto do config
};

// Buscar URL de configuração externa
(async () => {
  try {
    const response = await fetch("https://sua-api.com/config");
    const data = await response.json();
    CONFIG.API_URL = data.apiUrl;
  } catch (error) {
    console.error("Erro ao carregar configuração:", error);
  }
})();
```

---

## 🎯 Qual escolher?

| Solução             | Dificuldade | Segurança | Automação |
| ------------------- | ----------- | --------- | --------- |
| **GitHub Actions**  | ⭐⭐        | 🔒🔒🔒    | ✅ Sim    |
| **Branch Separada** | ⭐          | 🔒🔒      | ❌ Manual |
| **Deploy Local**    | ⭐          | 🔒        | ⚠️ Semi   |
| **Runtime Fetch**   | ⭐⭐⭐      | 🔒🔒🔒    | ✅ Sim    |

### Recomendação:

**Use GitHub Actions** se quiser automatizar tudo.

---

## ✅ Verificação de Segurança

Antes de fazer push, sempre confira:

```powershell
# Ver o que será enviado
git status

# Se config.js aparecer, PARE!
# Ele deve estar no .gitignore
```

**Arquivos que DEVEM aparecer para commit:**

- ✅ `config.js.template`
- ✅ `Code.gs.template`

**Arquivos que NÃO devem aparecer:**

- ❌ `config.js` (com URL real)
- ❌ `Code.gs` (com senhas)
