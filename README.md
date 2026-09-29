# Model Town

**Aprenda Machine Learning cuidando da inteligência de uma cidade.**

Model Town é um jogo educativo isométrico, com clima lo-fi futurista, em que você resolve problemas reais dos moradores construindo modelos de IA. Não é um curso com quizzes: você aprende fazendo. Escolhe dados, limpa, treina, avalia, coloca em produção e vê as consequências.

> **Jogar:** https://SEU-USUARIO.github.io/NOME-DO-REPO/ *(atualize depois do primeiro deploy)*

## A primeira missão: Pontes em Perigo

A prefeitura tem 480 pontes e poucas equipes de inspeção. Sua tarefa é criar um modelo que preveja quais pontes precisam de manutenção.

| Prédio | O que você faz | O que você descobre |
|---|---|---|
| Prefeitura | Recebe o problema | Todo projeto de IA começa com uma pergunta |
| Data Center | Descobre qual coluna é o label e escolhe as features | Dataset, label, feature |
| Data Cleaning Lab | Trata valores ausentes, duplicados e outliers | Lixo entra, lixo sai |
| ML Lab | Escolhe o algoritmo, ajusta parâmetros e treina (modo visual ou Python) | Treino/teste, Regressão Logística, Árvore, Random Forest |
| Evaluation Center | Lê as métricas e a matriz de confusão e ajusta o limiar de alerta | Accuracy, precision, recall, falso negativo |
| Deployment Center | Coloca o modelo "perfeito" do Engenheiro Otto em produção | Deployment |
| Monitoring Center | Vê o acerto despencar em pontes novas, investiga e corrige | **Overfitting**, underfitting, generalização |

Os números não são inventados. Os modelos (Regressão Logística, Árvore de Decisão CART e Random Forest) são implementados de verdade em TypeScript e treinados num dataset fictício, mas coerente, gerado com seed. As decisões do jogador mudam o resultado.

### Recursos

- **PT / EN**, com troca a qualquer momento.
- **Tema claro e escuro**, que segue a preferência do sistema na primeira visita.
- **Pistas**: a coruja Tuca explica a ideia de IA de cada momento, os próximos passos e, se você pedir, a resposta.
- **Caderno de Descobertas** com os conceitos que você já viveu.
- **Progresso salvo** no navegador (`localStorage`). Não há contas nem backend.
- **Feedback** ao final da missão, enviado por e-mail.

## Rodar localmente

Requer Node 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera a versão de produção em dist/
npm run preview    # serve o build localmente
```

**Controles:** WASD ou setas para andar · clique para caminhar até um lugar · **E** para entrar num prédio · roda do mouse para zoom · **Esc** fecha os painéis.

## Deploy no GitHub Pages

O repositório já vem com o workflow `.github/workflows/deploy.yml`, que faz o build e publica a cada push na `main`.

1. Crie um repositório no GitHub (público, para o Pages gratuito).
2. Conecte e envie:
   ```bash
   git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPO.git
   git push -u origin main
   ```
3. No GitHub, vá em **Settings → Pages → Build and deployment → Source** e escolha **GitHub Actions**.
4. Acompanhe na aba **Actions**. Quando terminar, o jogo fica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

O build usa caminhos relativos (`base: './'` no Vite), então funciona em qualquer nome de repositório sem configuração extra.

## Tecnologias

React, TypeScript, Vite, Tailwind CSS, Phaser 3 (cidade), Zustand (estado), Recharts (gráficos) e CodeMirror (editor Python).

## Arquitetura

```
React (UI, regras, estado)  ⇄  EventBus tipado  ⇄  Phaser (cidade isométrica)
        │
        └── ml/engine (interface MLEngine)
              ├─ LocalEngine   → modelos em TypeScript (padrão)
              └─ RemoteEngine  → pronto para um backend FastAPI + scikit-learn
```

```
src/
  bridge/     EventBus: o contrato entre React e Phaser
  game/       Phaser: mapa, texturas geradas em código, pathfinding, cena
  ml/         dataset, limpeza, modelos, métricas, gerador de código Python
  content/    prédios, conceitos, mundos, missões, pistas
  i18n/       textos em pt e en (tipados: faltou tradução = erro de compilação)
  store/      estado do jogo e progresso salvo
  ui/         HUD, painéis dos prédios, ilustrações SVG, telas
```

**Backend Python no futuro:** implemente `POST /train`, recebendo o `TrainRequest` definido em `src/ml/engine/types.ts`, e rode com `VITE_ML_BACKEND_URL=https://sua-api`. A interface não muda.

**Novas missões e mundos:** `src/content/worlds.ts` já descreve os 7 mundos (Fundamentos até MLOps). Cada missão é uma lista de etapas em `src/content/missions/`, com textos em `src/i18n/`.

## Feedback

Terminou a missão? O jogo abre um formulário curto no final. Sugestões de novas missões são muito bem-vindas: abra uma *issue* ou use o formulário.

## Créditos

- Personagens do mapa: [Kenney, Toon Characters](https://kenney.nl/assets/toon-characters) (CC0), em `public/assets/kenney-toon/`, recoloridos em tempo de execução.
- Retratos: [DiceBear, Adventurer](https://www.dicebear.com/styles/adventurer/), arte de Lisa Wischofsky ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)).
- Fontes: Fredoka e Nunito (SIL Open Font License), via Fontsource.
- Cidade, prédios, ícones, logo e coruja: desenhados em código.
