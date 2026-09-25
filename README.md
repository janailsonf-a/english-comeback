# English Comeback — Learning Engine v1

Aplicativo mobile de prática de inglês com uma campanha local de **90 Study Days**. A experiência combina aprendizado, progressão de RPG e uma jornada permanente. XP e Levels representam esforço e engajamento; não representam proficiência no idioma.

## Executar

Use Node.js 22.23.1, definido em `.nvmrc` e `package.json`.

```sh
cd ~/Projetos/english-comeback
nvm use
npm ci
npm start -- --lan --port 8082
```

No iPhone, mantenha computador e celular na mesma rede, abra o Expo Go atualizado e leia o QR code com a câmera. CLI e Expo Go devem estar na mesma conta Expo (`npx expo whoami` e, se necessário, `npx expo login`). Se a porta estiver ocupada, aceite outra porta livre.

## Interactive Missions

Daily Quests agora apontam para dois tipos de experiência:

- **Interactive Mission — Practice here:** abre o Mission Player, registra uma tentativa e só concede recompensa quando a condição de conclusão é válida.
- **External Mission — Practice outside:** mantém a confirmação manual para Busuu, uma aula externa ou material escolhido pelo jogador.

O fluxo interativo é `Intro → Start → Experience → Result → Reward Sequence`. Iniciar ou reabrir uma missão não concede XP. Ao sair, o passo e o tempo confirmado ficam pausados; ao reabrir o aplicativo, uma missão que estava em andamento também volta como `PAUSED`.

Tipos disponíveis:

- **Speaking:** timer, prompts progressivos e gravação local opcional. Não há transcrição, análise de pronúncia ou score.
- **Listening:** dois áudios curtos incluídos no app, controles claros e questões de múltipla escolha. Funciona offline.
- **Reading:** texto local, múltipla escolha e verdadeiro/falso.
- **Vocabulary:** múltipla escolha, fill the gap e prática escrita autodeclarada, sem avaliação automática.

World 01 possui dez missões interativas: BREAK THE SILENCE, TELL YOUR STORY, MY DAY, TRAIN YOUR EARS, THE VOICE MESSAGE, THE MESSAGE, READ THE CLUE, MEMORY BATTLE, CHOOSE YOUR WORD e USE YOUR WEAPON. KNOWLEDGE SCROLL e GRAMMAR DUNGEON continuam externas. Cinco agendas locais determinísticas distribuem o conteúdo pelos Study Days, sem três atividades iguais no mesmo dia.

BREAK THE SILENCE exige os quatro prompts e três minutos de atividade. A gravação é opcional porque permissão ou hardware indisponível não devem impedir a prática. O timer é local à tela e AsyncStorage recebe apenas eventos relevantes, nunca um write por segundo.

## Recompensas e métricas

A conclusão válida cria atomicamente:

- um `MissionAttempt` estável;
- uma `StudySession` na categoria praticada;
- um registro de XP;
- status `completed` da Daily Quest;
- bônus e Study Day quando for a terceira missão do dia.

Repetir toque, rerender, reabrir o app ou reenviar uma ação não duplica tentativa, sessão, XP, bônus ou Study Day. A Reward Sequence apresenta em ordem os eventos aplicáveis: Mission Complete, Level Up, unlocks, Study Day Complete e Chapter Advance. Ela possui Continue e Skip para não se tornar um obstáculo diário.

Progress mostra **Interactive Missions Completed** e os minutos reais registrados em Speaking, Listening, Reading e Vocabulary. Erros em questões não retiram XP. Nenhum resultado vira percentual, nota ou estimativa de proficiência.

Speaking Missions também alimentam `PREPARING FOR: THE SILENCE`, com progresso 0/5 a 5/5. Esse indicador não altera o HP do Boss; HP só muda durante a batalha oficial após os 14 Study Days.

## Learning Engine

O Vocabulary Vault começa com cinco palavras ligadas ao conteúdo local e aceita importação manual de palavras ou expressões estudadas anteriormente. Respostas de Vocabulary Missions geram revisões `CORRECT`, `INCORRECT` ou `PRACTICED`; prática escrita autodeclarada nunca é tratada como resposta correta.

Cada palavra possui histórico, próximo dia de revisão e estado `NEW`, `LEARNING`, `REVIEW` ou `MASTERED`. Intervalos iniciais de 1, 3, 7 e 30 dias priorizam palavras fracas ou vencidas ao escolher missões de vocabulário para Study Days futuros. Quests já persistidas não são reescritas. Esses estados representam somente o histórico de revisão dentro do app, não proficiência em inglês.

## Arquitetura

```text
src/
  app/
    (tabs)/                         # Home, Quests, Journey, Progress, Profile
    mission/[questId].tsx           # rota do Mission Player
  components/                       # Button, Screen, Sheet, ProgressBar e Text
  features/
    missions/
      MissionPlayerScreen.tsx       # composição da experiência
      components/                   # áudio, recorder, questions, header, playback
      hooks/useMissionTimer.ts      # timer local sem writes por tick
    game/
      missions/
        content.ts                  # conteúdo tipado e agenda de World 01
        types.ts                    # definitions, runs, attempts e actions
        rules.ts                    # state machine e conclusão atômica
        selectors.ts                # status, condições, métricas e Boss preparation
        migration.ts                # enriquecimento seguro do schema anterior
        rewardSequence.ts           # ordem dos eventos pós-missão
      learning/
        config.ts                   # conteúdo inicial, bindings e intervalos
        rules.ts                    # importação, revisões e progressão de domínio
        selectors.ts                # due/weak, métricas e recomendação de missão
      journey/                      # campanha, XP, Study Days, Boss e narrativa
      domain/gameSession.ts         # fila compute → persist → publish
      persistence/learningStorage.ts # schema 5, migração e validação
      state/GameProvider.tsx        # ações para a UI
assets/missions/                    # dois WAVs locais de Listening
tests/learning.test.cjs             # Learning Engine, integração e schema 5
tests/missions.test.cjs             # Mission Engine, integração e schema 4
```

A direção permanece `UI → state/actions → domain rules → persistence`. Conteúdo é configuração TypeScript e não fica hardcoded nos renderizadores. O Mission Engine aceita novos tipos no futuro sem exigir um componente por atividade.

## Persistência — schema 5

A chave ativa é `@english-comeback/learning-v5`, com `schemaVersion: 5`. O registro contém a Journey inteira, incluindo campanha, capítulos, XP, Levels, calendário, Rest Tokens, Boss, achievements, Titles, Time Capsules, Study Sessions, missão ativa, tentativas, inventário de vocabulário e histórico de revisões.

Na ausência de v5, o adapter lê o schema 4 e adiciona o Learning Engine sem alterar progressão ou recompensas. A cadeia anterior 3→4 continua preservada: quests já concluídas no schema 3 permanecem histórico externo e nenhuma revisão é inventada retroativamente. Saves anteriores permanecem armazenados.

Uma missão `IN_PROGRESS` encontrada ao carregar é persistida como `PAUSED`. A validação também confere IDs e termos únicos, contadores, datas de revisão e o vínculo entre review, attempt, mission step e resposta. Dados inválidos ou schema futuro geram erro sem sobrescrever o registro.

## Sistema preservado

Continuam ativos: START MY JOURNEY, Prologue, Time Capsules locais, THE AWAKENING, 90 Study Days, cinco Worlds, Chapters, Trilogy, THE NEW JOB como Final Horizon, XP e Level overflow, Daily Bonus, Streak, Rest Tokens, Comeback Mode, THE SILENCE, achievements, Titles equipáveis, projected completion, Journey, AsyncStorage e Developer Panel.

A Journey nunca regride por inatividade. XP, Level, Study Days, Worlds, Bosses, achievements, Titles, Time Capsules e histórico não diminuem. Streak pode terminar; o restante permanece.

## Developer Panel

Disponível apenas em development mode em **Profile → Development tools**. As ações de missão são:

- Start Interactive Mission;
- Complete Active Mission;
- Reset Active Mission;
- Answer Current Question Correctly;
- Answer Current Question Incorrectly;
- Complete Speaking Timer.

Ao sair de uma missão para abrir Profile, ela fica pausada. Os atalhos retomam essa tentativa internamente antes de executar a ação. Bypass de conclusão depende de `__DEV__` na UI e de `developmentData` no domínio. Bundles de produção removeram o rótulo do painel durante a validação minificada.

As ferramentas anteriores continuam disponíveis para Prologue, Titles, Time Capsules, Journey Pace, Study Day, XP, inatividade, Rest Tokens, Boss e RESET JOURNEY. Dados acelerados são marcados como desenvolvimento.

## Testar no iPhone

1. Inicie `npm start -- --lan --port 8082`, abra pelo QR code no Expo Go e recarregue o projeto.
2. Em uma jornada nova, toque START MY JOURNEY e conclua ou pule o Prologue.
3. Na Home, abra **BREAK THE SILENCE**. Confira a introdução e toque START MISSION.
4. Opcionalmente, toque START RECORDING e permita o microfone. O áudio permanece local.
5. Fale seguindo os quatro prompts. NEXT STEP salva o tempo atual. Depois de 03:00, toque COMPLETE MISSION.
6. Confira Mission Complete, +30 XP, +3 min Speaking, Level/Daily/Chapter progress e a Reward Sequence. Se gravou, teste PLAY MY RECORDING.
7. Volte à Home. Abra **TRAIN YOUR EARS**, reproduza o áudio local, responda às duas questões e conclua. Uma resposta errada deve mostrar NOT QUITE e a explicação, sem punição de XP.
8. Complete **KNOWLEDGE SCROLL** como External Mission. O primeiro dia totaliza 80 XP: 20 Listening + 30 Speaking + 10 external + 20 daily bonus.
9. Use Developer Panel → Advance Study Day até chegar ao Study Day 3. Abra **MEMORY BATTLE**, responda aos desafios e confirme o histórico no **Vocabulary Vault**, em Progress.
10. Durante uma missão, use o botão X → Save and leave. Reabra a mesma quest e confira MISSION PAUSED → RESUME MISSION. Repita fechando totalmente o Expo Go; o save deve continuar pausado e sem XP indevido.
11. Em Progress, confira Speaking, Listening, Reading, Vocabulary e Interactive Missions. Em THE SILENCE, confira Boss preparation separado do HP.
12. Para testar rápido, use Start Interactive Mission e depois Complete Active Mission no painel. Esses registros ficam marcados como desenvolvimento.
13. Em Progress → Vocabulary Vault, toque **ADD A WORD**, salve uma palavra com significado e reinicie o Expo Go para confirmar a persistência.

## Verificações

```sh
npm run check:game
npm run lint
npm run typecheck
npm run check:expo
npm run audit:ci
npm run export:web
npm run export:ios
npm run export:android
```

Resultado atual: **145/145 testes passando**. Lint sem warnings e TypeScript sem erros. A validação completa de dependências e exports permanece disponível nos comandos acima.

## Limitações atuais

- Não existe IA, speech-to-text, análise de pronúncia, correção automática ou score linguístico.
- Speaking usa timer, sequência de prompts e autodeclaração; o app não tenta detectar se a pessoa realmente falou.
- Listening usa dois áudios locais sintéticos e um conjunto pequeno de conteúdo controlado.
- A gravação de Speaking é opcional, local e reproduzível somente no dispositivo que mantém o arquivo.
- Não há pause de gravação; há Start, Stop, Playback e Record Again.
- Tentativas concluídas são permanentes. Ainda não existe histórico detalhado na UI nem replay de respostas antigas.
- Apenas World 01 é jogável. Campaign II e III continuam bloqueadas.
- O agendamento de revisão é deliberadamente simples; ainda não existe um algoritmo completo de spaced repetition nem edição/remoção do inventário na UI.
- Palavras importadas manualmente entram no Vault, mas ainda não geram conteúdo novo automaticamente porque não há IA nem templates locais para elas.
- Não há backend, conta, cloud sync ou recuperação dos arquivos de áudio após remover o aplicativo.

## DevOps e builds

O workflow `.github/workflows/ci.yml` roda em pushes para `master`, pull requests e execução manual. Ele usa Node 22.23.1 com cache npm, executa a suíte completa, lint, TypeScript, compatibilidade Expo, audit para HIGH/CRITICAL e exports web, iOS e Android. O export web fica disponível por sete dias como artifact. Os 13 alertas MODERATE transitivos conhecidos não são mascarados, mas não bloqueiam a CI.

O workflow `.github/workflows/eas-build.yml` é exclusivamente manual, aceita iOS ou Android e usa `preview` como padrão. `production` exige seleção explícita e o workflow não submete builds às lojas. Para utilizá-lo:

1. Crie um Access Token na conta Expo.
2. No GitHub, crie os Environments `development`, `preview` e `production`.
3. Adicione `EXPO_TOKEN` como Environment Secret, nunca como texto no workflow.
4. Abra **Actions → EAS Build → Run workflow** e escolha plataforma e perfil.

Os perfis em `eas.json` possuem finalidades diferentes:

- `development`: inclui `expo-dev-client`, ferramentas de desenvolvimento e depende do Metro para carregar o projeto;
- `preview`: aplicativo autônomo, sem ferramentas de desenvolvimento, para teste próximo da produção;
- `production`: futuro binário de loja; não é construído ou publicado automaticamente.

Expo Go continua útil para iteração rápida enquanto as APIs utilizadas forem compatíveis. Development Build testa o cliente nativo próprio. Preview Build é a validação real sem Metro. No iPhone, o preview interno exige Apple Developer Program, registro do UDID e assinatura ad hoc.

O projeto está vinculado a `@janailsonf-a/english-comeback`. Em uma máquina nova:

```sh
npx eas-cli@24.8.0 login
npx eas-cli@24.8.0 whoami
```

Para iniciar manualmente um preview iOS, após registrar o aparelho e configurar as credenciais Apple:

```sh
npx eas-cli@24.8.0 device:create
npx eas-cli@24.8.0 build --platform ios --profile preview
```

O bundle identifier iOS e o application ID Android são `com.janailsonfa.englishcomeback`. Tokens, certificados e provisioning profiles nunca devem ser adicionados ao Git.
