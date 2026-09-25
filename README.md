# Meu Patrimônio 📊

Aplicativo web para controle pessoal de investimentos e gestão de patrimônio, integrado com Google Sheets e autenticação via Google OAuth.

## Funcionalidades
- **Gestão de Aportes**: Registro de compras de ações, FIIs, ETFs, renda fixa, criptoativos e reserva de emergência.
- **Carteira**: Visualização e gerenciamento de todos os lançamentos com filtro e exclusão.
- **Resumo Visual**: Gráficos de aportes mensais com acompanhamento de metas e gráfico de distribuição patrimonial.
- **Autenticação Segura com Google**: Apenas usuários autorizados na lista de e-mails permitidos têm acesso aos dados.
- **Sincronização em Nuvem**: Dados salvos diretamente na sua planilha Google Sheets via Google Apps Script.

## Estrutura do Repositório
- `index.html`: Interface da aplicação.
- `config.js`: Configurações da API e ID do cliente Google.
- `apps-script/Code.gs`: Código do backend para o Google Apps Script.
- `apps-script/appsscript.json`: Manifesto de configuração do Apps Script.
- `template/meu-patrimonio-dados.xlsx`: Modelo de estrutura da planilha.
