# 💰 FinnanceFlow

Plataforma web mobile-first para gerenciamento financeiro de casais. Organize suas finanças de forma simples, com dados no Google Sheets e hospedagem gratuita no GitHub Pages.

---

## ✨ Funcionalidades

- 🔐 Autenticação segura com usuário e senha
- 📊 Dashboard interativo com resumo financeiro
- 👥 Visões personalizadas (individual ou geral)
- 💳 Gerenciamento de transações (receitas e despesas)
- 🔄 Transações recorrentes automáticas
- 📅 Filtro por mês e ano
- ✅ Controle de pagamentos
- 📱 Design responsivo mobile-first
- ☁️ Dados na nuvem (Google Sheets)
- 🆓 Totalmente gratuito

---

## 🚀 Instalação Rápida (10 minutos)

### 1️⃣ Configure o Google Sheets

1. Acesse [Google Sheets](https://sheets.google.com) e crie uma planilha
2. Vá em **Extensões** > **Apps Script**
3. Delete o código padrão

### 2️⃣ Configure o Backend

1. Copie o arquivo template:

   ```powershell
   Copy-Item appscript\Code.gs.template appscript\Code.gs
   ```

2. Abra `appscript/Code.gs` e configure seus usuários:

   ```javascript
   USERS: {
     'seu_usuario': 'sua_senha_forte',      // ⚠️ ALTERE!
     'outro_usuario': 'outra_senha_forte',  // ⚠️ ALTERE!
   }
   ```

3. Cole o código no Apps Script e salve (Ctrl+S)

### 3️⃣ Implante o Apps Script

1. Clique em **Implantar** > **Nova implantação**
2. Tipo: **Aplicativo da Web**
3. Executar como: **Eu**
4. Quem tem acesso: **Qualquer pessoa** ⚠️
5. Clique em **Implantar**
6. Autorize quando solicitado
7. **Copie a URL** (termina com `/exec`)

### 4️⃣ Configure o Frontend

1. Copie o arquivo template:

   ```powershell
   Copy-Item js\config.js.template js\config.js
   ```

2. Abra `js/config.js` e cole a URL:

   ```javascript
   API_URL: 'https://script.google.com/macros/s/SEU_ID_AQUI/exec',

   PERSON_NAMES: {
       pessoa1: 'Seu Nome',
       pessoa2: 'Nome do Parceiro'
   }
   ```

### 5️⃣ Publique no GitHub Pages

**IMPORTANTE:** O arquivo `config.js` com sua URL real **NÃO será enviado** ao GitHub (está no `.gitignore`).

#### Opção A: Deploy Automático (Recomendado) 🚀

1. **Configure o Secret no GitHub:**

   - Vá em **Settings** > **Secrets and variables** > **Actions**
   - Clique em **New repository secret**
   - Nome: `APPS_SCRIPT_URL`
   - Valor: Cole apenas o ID do seu script (entre `/s/` e `/exec`)

2. **Ative GitHub Pages:**

   - **Settings** > **Pages** > Source: **GitHub Actions**

3. **Faça o commit:**
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/SEU_USUARIO/FinnanceFlow.git
   git push -u origin main
   ```

O deploy automático injeta sua URL de forma segura! ✅

#### Opção B: Deploy Manual

Veja outras opções em **[DEPLOY.md](DEPLOY.md)**

### 6️⃣ Atualize o CORS

Volte no `appscript/Code.gs` e adicione seu domínio:

```javascript
ALLOWED_ORIGINS: [
  "https://SEU_USUARIO.github.io",  // ⚠️ Adicione aqui
],
```

Salve e reimplante o Apps Script.

---

## 🔐 Segurança dos Arquivos

### ⚠️ IMPORTANTE - Não Commite:

Os seguintes arquivos contêm informações sensíveis e **NÃO devem ser commitados**:

- ❌ `appscript/Code.gs` (contém senhas)
- ❌ `js/config.js` (contém URL da API)

Eles já estão no `.gitignore` e ficam apenas no seu computador.

### ✅ Use os Templates:

- ✅ `appscript/Code.gs.template` (versão pública)
- ✅ `js/config.js.template` (versão pública)

**Workflow:**

1. Clone o repositório
2. Copie os `.template` para os arquivos reais
3. Configure com suas credenciais
4. Nunca commite os arquivos reais

---

## 📖 Estrutura do Projeto

```
FinnanceFlow/
├── index.html              # Página de login
├── dashboard.html          # Painel principal
├── css/
│   ├── styles.css         # Estilos globais
│   └── dashboard.css      # Estilos do dashboard
├── js/
│   ├── config.js          # ⚠️ Configurações (NÃO commitar)
│   ├── config.js.template # Template público
│   ├── auth.js           # Autenticação
│   ├── api.js            # Cliente da API
│   ├── dashboard.js      # Lógica do dashboard
│   └── monthFilter.js    # Filtro de mês/ano
└── appscript/
    ├── Code.gs           # ⚠️ Backend (NÃO commitar)
    └── Code.gs.template  # Template público
```

---

## 🔧 Resolução de Problemas

### Erro: "Failed to fetch"

**Causa:** Apps Script não está acessível.

**Solução:**

1. Abra `test-api.html` no navegador para diagnóstico
2. Verifique se a URL em `config.js` está correta
3. Confirme que o Apps Script foi implantado
4. Verifique que o acesso está como "Qualquer pessoa"

### Erro de CORS

**Causa:** Acessando de `localhost` ou `file://`

**Soluções:**

- ✅ Use GitHub Pages (solução permanente)
- ⚠️ Temporário: Instale extensão CORS Unblock no Chrome
- ⚠️ Temporário: Chrome sem segurança (não recomendado)

### Login não funciona

**Verifique:**

1. Usuário e senha estão corretos no `Code.gs`
2. Apps Script foi salvo após alterações
3. Apps Script foi reimplantado
4. URL da API está correta

### Transações não aparecem

**Verifique:**

1. Filtro de mês está correto
2. Transação foi criada no mês selecionado
3. Pessoa selecionada corresponde ao usuário logado ou "shared"

---

## 📊 Como Usar

### Login

- Use as credenciais configuradas no `Code.gs`
- O token de autenticação expira em 24 horas

### Visões do Dashboard

- **Botões no topo:** Alterne entre visão pessoal ou geral
- Cada usuário vê apenas suas transações + compartilhadas

### Criar Transação

1. Clique no botão **+**
2. Preencha os campos
3. Marque "Recorrente" se repetir mensalmente
4. Clique em **Salvar**

### Transações Recorrentes

- Quando marcar como **Paga**, uma nova transação é criada automaticamente para o próximo mês
- Ideal para: aluguel, condomínio, assinaturas, etc.

### Filtro de Mês

- Use as setas **← →** para navegar entre meses
- Sempre inicia no mês atual

### Editar/Excluir

- Clique no **ícone de lápis** para editar
- Clique no **ícone de lixeira** para excluir

---

## 🛠️ Tecnologias

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Google Apps Script
- **Banco de Dados:** Google Sheets
- **Hospedagem:** GitHub Pages
- **Autenticação:** Token-based (24h)

---

## 📝 Estrutura do Google Sheets

### Aba: Transacoes

| Coluna           | Tipo      | Descrição                       |
| ---------------- | --------- | ------------------------------- |
| ID               | Texto     | ID único da transação           |
| Descrição        | Texto     | Nome da transação               |
| Valor            | Número    | Valor (positivo ou negativo)    |
| Tipo             | Texto     | "receita" ou "despesa"          |
| Pessoa           | Texto     | Username ou "shared"            |
| Categoria        | Texto     | Ex: "Alimentação", "Transporte" |
| Data Vencimento  | Data      | Data de vencimento              |
| Status           | Texto     | "paga" ou "pendente"            |
| Observações      | Texto     | Notas adicionais                |
| Recorrente       | Texto     | "sim" ou "não"                  |
| Data Criação     | Data/Hora | Timestamp de criação            |
| Data Atualização | Data/Hora | Timestamp de atualização        |

### Aba: Tokens

| Coluna   | Descrição              |
| -------- | ---------------------- |
| Token    | Token de autenticação  |
| Username | Usuário associado      |
| Expiry   | Data/hora de expiração |

---

## 🚀 Atualizações Futuras

- [ ] Categorias customizáveis
- [ ] Gráficos de despesas
- [ ] Exportação para Excel/PDF
- [ ] Notificações de vencimento
- [ ] Metas de economia
- [ ] Modo escuro

---

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

**⚠️ Lembre-se:** Nunca commite arquivos com credenciais reais!

---

## 💡 Dicas

- **Backup:** Exporte regularmente sua planilha Google Sheets
- **Senhas:** Use senhas fortes e únicas
- **HTTPS:** Sempre use o site via HTTPS (GitHub Pages)
- **Token:** Faça logout se não for usar por um tempo
- **Privacidade:** Cada usuário vê apenas suas transações + compartilhadas

---

**Desenvolvido com ❤️ para casais organizados financeiramente**
