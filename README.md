# English Comeback — Interactive Missions v1

Aplicativo mobile de prática de inglês com uma campanha local de **90 Study Days**. A experiência combina aprendizado, progressão de RPG e uma jornada permanente. XP e Levels representam esforço e engajamento; não representam proficiência no idioma.

## Executar

```sh
cd ~/Projetos/english-comeback
npm install
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
      journey/                      # campanha, XP, Study Days, Boss e narrativa
      domain/gameSession.ts         # fila compute → persist → publish
      persistence/missionStorage.ts # schema 4 e validação
      state/GameProvider.tsx        # ações para a UI
assets/missions/                    # dois WAVs locais de Listening
tests/missions.test.cjs             # Mission Engine, integração e schema 4
```

A direção permanece `UI → state/actions → domain rules → persistence`. Conteúdo é configuração TypeScript e não fica hardcoded nos renderizadores. O Mission Engine aceita novos tipos no futuro sem exigir um componente por atividade.

## Persistência — schema 4

A chave ativa é `@english-comeback/missions-v4`, com `schemaVersion: 4`. O registro contém a Journey inteira, incluindo campanha, capítulos, XP, Levels, calendário, Rest Tokens, Boss, achievements, Titles, Time Capsules, Study Sessions, missão ativa e tentativas.

Na ausência de v4, o adapter lê o schema 3 e adiciona `missions`, metadados estáveis às quests e tipos de experiência. Quests já concluídas no schema 3 permanecem histórico externo: a migração não inventa tentativas nem reescreve recompensas passadas. Saves anteriores permanecem armazenados.

Uma missão `IN_PROGRESS` encontrada ao carregar é persistida como `PAUSED`. A validação confere definições, reward, category, world/chapter, timestamps, calendário local, answers, duração mínima, recording reference, vínculo attempt/session/XP e unicidade. Dados inválidos ou schema futuro geram erro sem sobrescrever o registro.

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
9. Use Developer Panel → Advance Study Day até chegar ao Study Day 3. Abra **MEMORY BATTLE**, responda aos desafios e confirme Vocabulary em Progress.
10. Durante uma missão, use o botão X → Save and leave. Reabra a mesma quest e confira MISSION PAUSED → RESUME MISSION. Repita fechando totalmente o Expo Go; o save deve continuar pausado e sem XP indevido.
11. Em Progress, confira Speaking, Listening, Reading, Vocabulary e Interactive Missions. Em THE SILENCE, confira Boss preparation separado do HP.
12. Para testar rápido, use Start Interactive Mission e depois Complete Active Mission no painel. Esses registros ficam marcados como desenvolvimento.

## Verificações

```sh
npm run check:game
npm run lint
npm run typecheck
npx expo install --check
npx expo export --platform web
npx expo export:embed --eager --platform ios --dev false --minify true ...
npx expo export:embed --eager --platform android --dev false --minify true ...
```

Resultado atual: **131/131 testes passando**. Lint sem warnings, TypeScript sem erros, dependências compatíveis com Expo SDK 57 e bundles de produção aprovados para web, iOS e Android. O export web também foi servido localmente e carregou em viewport 390×844 sem erro de runtime.

## Limitações atuais

- Não existe IA, speech-to-text, análise de pronúncia, correção automática ou score linguístico.
- Speaking usa timer, sequência de prompts e autodeclaração; o app não tenta detectar se a pessoa realmente falou.
- Listening usa dois áudios locais sintéticos e um conjunto pequeno de conteúdo controlado.
- A gravação de Speaking é opcional, local e reproduzível somente no dispositivo que mantém o arquivo.
- Não há pause de gravação; há Start, Stop, Playback e Record Again.
- Tentativas concluídas são permanentes. Ainda não existe histórico detalhado na UI nem replay de respostas antigas.
- Apenas World 01 é jogável. Campaign II e III continuam bloqueadas.
- O Learning Engine, vocabulary inventory e spaced repetition ainda não existem.
- Não há backend, conta, cloud sync ou recuperação dos arquivos de áudio após remover o aplicativo.
