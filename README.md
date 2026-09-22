# English Comeback — Narrative & Game Feel v1

Aplicativo mobile de estudo de inglês com uma campanha local de **90 Study Days**. A primeira versão jogável cobre World 01, THE COMEBACK, e seu Boss, THE SILENCE. XP e níveis representam esforço; não representam proficiência linguística.

## Executar

```sh
cd ~/Projetos/english-comeback
npm install
npm start -- --lan --port 8082
```

O app usa Expo SDK 57, React Native, TypeScript e Expo Router. Se a porta estiver ocupada, escolha outra porta livre. O React Native não usa Docker nesta etapa.

No iPhone, use Expo Go atualizado, conecte celular e computador à mesma rede e leia o QR code com a câmera. CLI e Expo Go devem estar conectados à mesma conta Expo (`npx expo login` / `npx expo whoami`). O usuário já validou o MVP e seu salvamento local no iPhone; a nova campanha precisa repetir essa validação física. A documentação do SDK é [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).

## Narrativa e game feel

A campanha existente é **English Comeback I — THE AWAKENING**. As campanhas II (THE PREPARATION) e III (THE OPPORTUNITY) aparecem bloqueadas. THE NEW JOB é um horizonte narrativo profissional, não uma recompensa automática nem promessa de emprego. XP, níveis, achievements, Titles e histórico pertencem ao jogador; nenhuma transição narrativa reinicia esses registros.

- Capítulos iniciais configurados: THE RETURN (Study Days 1–7), FINDING YOUR VOICE (8–14) e BEYOND THE CLASSROOM (15–30). A posição aguarda o Boss no fim de World 01. Limites e textos ficam na configuração, e progresso é derivado dos Study Days.
- Home com YOUR PATH, capítulo atual e mensagens acolhedoras. Journey com capítulo, cinco Worlds, trilogia e horizonte distante sem ação de clique.
- Quest completion com título, categoria, XP, barra animada e progresso diário. Daily completion mostra bônus, passagem de Study Day e progresso do capítulo. Level Up, achievements e Titles recebem feedback visual; haptics usam Expo e falham graciosamente. Animações curtas respeitam movimento reduzido.
- Titles permanentes: THE RETURNER (LV.5), VOICE SEEKER (30 minutos de Speaking registrados) e SILENCE BREAKER (THE SILENCE derrotado). Profile permite equipar/desequipar sem alterar XP ou progresso linguístico.
- Prologue de novas jornadas: WHERE ARE YOU NOW?, com o prompt “Tell me about yourself in English.”. É possível gravar localmente ou continuar sem gravação. Nenhuma opção concede XP, minutos de estudo ou score.
- Time Capsules com áudio local em documentos do app, reprodução e metadata persistida. Profile permite novas reflexões e mostra a preparação de checkpoints 1/14/30. Não há upload, transcrição, IA ou avaliação.
- PROJECTED COMPLETION estima apenas os 90 Study Days. Usa janela recente de 14 dias de calendário, exige pelo menos sete dias observados e três datas distintas com Study Day concluído. Mostra semanas aproximadas; sem dados suficientes, “Building your projection...”. Dias sem estudo entram no período observado. Não existe estimativa de conquista de emprego.

## Game System preservado

- Início explícito com START MY JOURNEY: Janailson, LV. 1, 0/100 XP, Study Day 0/90, streak zero e dois Rest Tokens.
- Cinco mundos configurados, com faixas 1–14, 15–30, 31–50, 51–70 e 71–90. Somente World 01 possui conteúdo jogável.
- Três quests por Study Day, com IDs distintos e seleção determinística entre dois trios rotativos do pool inicial. EASY/NORMAL/HARD concedem 10/20/30 XP.
- Bônus de 20 XP ao concluir as três quests, uma vez por Study Day. É possível estudar mais de um Study Day no mesmo dia de calendário.
- Curva oficial de XP: `100 + (level - 1) × 25`, com excedente e múltiplos level ups.
- Streak de calendário: somente uma conclusão diária aumenta streak. Quests parciais registram atividade, mas não aumentam streak.
- Rest Tokens automáticos para dias fechados sem Study Day concluído. Dois por semana, renovados na segunda-feira, máximo de quatro. Um token protege um dia, sem aumentar streak nem conceder XP/Study Day. Sem streak ativo, descanso não consome token.
- Reconciliação de calendário ao carregar, ao voltar ao primeiro plano e antes das ações. Sem timers ou processos em background. A ordem cronológica da renovação/consumo evita resultados diferentes conforme a frequência de abertura.
- NORMAL após até um dia de inatividade, WELCOME_BACK após dois e COMEBACK_MODE após três. Após sete dias, uma Return Quest de cinco minutos concede 20 XP, sem avançar Study Day. O período é contado desde a última atividade confirmada ou início.
- THE SILENCE após os 14 Study Days: cinco etapas manuais sequenciais, cada uma com um minuto de Speaking e 20 de dano; HP 100 → 0. Vitória concede 150 XP uma vez, completa World 01 e desbloqueia World 02, COMING SOON.
- Sete achievements locais, desbloqueados uma vez com timestamp; suporte a achievements ocultos. Nenhuma recompensa adicional de XP por achievement.
- Study Sessions com categoria, duração, origem, quest quando aplicável, timestamp UTC e data local. Missões com meta de uma lição não inventam duração.
- Quests funcional: Daily, Special e Completed; usa as mesmas ações da Home.
- Journey em mapa vertical, mundos, bloqueios, marcos, posição e Boss.
- Progress funcional: Study Days, minutos totais e por categoria, quests, Bosses, achievements, streak e tempo nos últimos 7/30 dias.
- Profile com início da Journey, mundo, XP total, Rest Tokens e achievements.
- Persistência local da jornada inteira, incluindo histórico, quests parciais, etapas do Boss e achievements.
- Developer Panel protegido por `__DEV__`, com confirmação explícita para reset.

## Estrutura e regras

```text
src/
  app/                              # Rotas e layouts Expo Router
  components/                       # UI compartilhada: cards primitivos, texto, barra, sheet, etc.
  theme/                            # Identidade visual existente
  hooks/                            # Preferência de movimento reduzido
  features/
    home/                           # Home e componentes de perfil/quest/feedback
    campaign/                       # Start, Quests, Journey, Progress, Profile
      components/                   # BossEncounter, UI compartilhada, DeveloperPanel
      hooks/useQuestInteraction.ts  # Interação reutilizada em Home e Quests
    game/
      types.ts                      # Contrato visual GameSnapshot
      journey/
        narrative/                  # Config saga/capítulos/Titles, Prologue/capsules e projeção
        config.ts                   # Worlds, recompensas, tokens, pool, Boss, achievements, checkpoints
        types.ts                    # Journey, sessões, registros de XP, achievement e avaliação futura
        calendar.ts                 # Helpers de datas, clock injetável e semana
        consistency.ts              # Streak, descanso, renovação e comeback
        stateFactory.ts             # Defaults, início e seleção de quests
        rewards.ts                  # Ledger de XP e unlock de achievements
        rules.ts                    # Ações de quest, bônus diário e Boss
        selectors.ts                # Métricas, mundos, quests e HP
        projectSnapshot.ts          # Projeção do domínio para o contrato da UI
        developerActions.ts         # Aceleração com regras reais e identificação de dados simulados
      domain/
        progression.ts              # Curva oficial
        legacyProgression.ts        # Apenas demonstração schema 1
        game.ts                     # Domínio da demonstração preservado
        gameSession.ts              # Fila de mutações; publica somente após salvar
      data/mockGame.ts              # Perfil/conteúdo legado, sem import direto pela UI
      services/                     # Adapter inicial e integração AsyncStorage
      persistence/                  # Schemas 1/2/3, validação e migração
      state/                        # Context, reducer e ações
    placeholders/                   # Telas anteriores preservadas, fora das rotas atuais
tests/
  game.test.cjs                      # 13 testes de regressão do MVP
  persistence.test.cjs               # 12 testes de regressão do salvamento original
  journey.test.cjs                   # Game System v1
  narrative.test.cjs                 # Narrativa, Titles, Prologue/capsules, projeção e schema 3
```

Componentes exibem dados, enquanto o provider encaminha ações à sessão. A sessão serializa ações, executa regras puras e aguarda a gravação antes de publicar XP, status ou feedback. Uma falha não modifica o snapshot anterior e permite tentar novamente. O reducer mantém estado visual e feedback. O relógio é injetável; o domínio não consulta a hora atual por conta própria.

As datas de calendário são `YYYY-MM-DD` obtidas do horário local do dispositivo. Timestamps são ISO UTC. Distâncias entre datas usam o ordinal de datas locais, sem misturar o dia UTC nem durações de 24 horas sujeitas a DST. Datas já gravadas não são reinterpretadas ao mudar de fuso. Voltar o relógio para antes da última data observada não concede recompensas; a jornada permanece salva.

IDs de atividades/recompensas são estáveis dentro da Journey (`day-N:template`, `quest:ID`, `day:N`, `boss:step`). A Journey tem ID próprio derivado do início; uma futura sincronização pode usar Journey ID junto ao ID da atividade. O serviço e o armazenamento são injetáveis. O servidor futuro ainda deverá implementar ownership e idempotência.

English Progress permanece separado. `SkillAssessment` e checkpoints nos Study Days 1/14/30/50/70/90 são preparação de modelo/configuração; não existem avaliações, notas fictícias ou aumento automático de skills.

O Game System v1 não precisou de novas bibliotecas. Nesta etapa foram adicionados somente módulos oficiais leves: `expo-audio`, `expo-file-system` e `expo-haptics`; Expo/Router receberam os patches recomendados pelo SDK. Foram reutilizados AsyncStorage, navegação, fontes locais, SVG, Lucide, gradientes e componentes existentes. Playwright e Prettier foram usados temporariamente fora das dependências do aplicativo.

## Persistência narrativa — schema 3

A chave ativa passa a ser `@english-comeback/narrative-v3`, com `schemaVersion: 3`. XP, quests, calendário, Boss, achievements, histórico e narrativa são gravados juntos. A sessão continua serializando mutações e publicando apenas depois da gravação bem-sucedida.

Se v3 não existir, o adapter lê a campanha v2 e acrescenta campanha/prologue/titles/capsules. Saves iniciados recebem Prologue `legacy` e continuam normalmente; não precisam refazer onboarding. Titles já conquistados são derivados do ledger e sessões existentes, preservando os timestamps de conquista. Saves novos começam com Prologue `pending`, e quests ficam bloqueadas até salvar ou escolher explicitamente continuar sem gravação.

Os registros v1/v2 permanecem intactos como arquivos anteriores. V3 válido tem prioridade. Dados inválidos ou schema futuro produzem erro sem sobrescrever o save ou retroceder para um arquivo antigo. A validação adicional cobre referências relativas locais, IDs únicos, title equipado desbloqueado, Prologue consistente e Study Day real das cápsulas. Capítulos e projeções são derivados; não duplicam histórico.

RESET JOURNEY confirmado limpa intencionalmente a jornada ativa, inclusive Titles e referências de cápsulas. Gravações físicas não são apagadas automaticamente nesta versão; limpar referências não altera arquivos que possam ser consultados durante desenvolvimento. Ao iniciar novamente, o Prologue fica pendente.

## Histórico dos schemas anteriores

O MVP usa `@english-comeback/progress`, schema 1. Esse registro mantém sua curva antiga exclusivamente como demonstração.

A campanha usa `@english-comeback/journey-v2`, com envelope `schemaVersion: 2` e a Journey completa. Na ausência de v2, lemos v1 sem escrever ou apagar nada e mostramos START MY JOURNEY. Somente essa ação cria a nova jornada em LV. 1. Reabrir uma jornada iniciada restaura v2 e não repete onboarding.

Um único registro contém XP, ledger, quests, bônus, Study Days, calendário, tokens, sessões, Boss e achievements. A validação confere tipos, IDs únicos, consistência de XP, dias concluídos e atividades. Defaults recuperam campos opcionais novos; dados essenciais ausentes, registros inválidos e schemas futuros são preservados e produzem erro de carga, sem reset silencioso.

No Game System v1, RESET JOURNEY gravava o estado não iniciado no schema 2 após confirmação explícita. O adapter atual grava schema 3. Nunca apaga o arquivo/registro legado de demonstração. Resetar é uma ação intencional destrutiva sobre a jornada atual; cancelar não altera o estado.

## Verificações

```sh
npm run check:game
npm run lint
npm run typecheck
npx expo install --check
npx expo export --platform all
```

**Base anterior: 76/76 testes. Etapa atual: 108/108 testes, preservando os 76 anteriores e acrescentando 32 testes de narrativa/persistência.** Lint e TypeScript passaram; `expo install --check` confirmou compatibilidade; iOS, Android e web foram exportados com sucesso. O fluxo completo de início, quests nas duas telas, bônus, level up, reabertura, Boss, retorno e reset foi validado no navegador em viewport mobile, sem erros de runtime/console. Um teste separado do bundle web de produção confirmou que Developer Panel e RESET JOURNEY não aparecem.

Os 25 testes anteriores foram mantidos; os testes da demonstração apontam para a curva legada para preservar sua regressão. A campanha possui testes específicos da curva oficial, inicialização, overflow, duplicação de quest/bônus/dia/sessão/achievement, calendário local/DST, streak, Rest Tokens/renovação, comeback/Return Quest, HP/etapas/vitória, unlock de mundo, migração, reset e falhas de gravação.

## Testar manualmente no iPhone

1. Inicie o Expo e abra o projeto pelo QR code. Se o projeto estiver aberto, recarregue para receber a atualização.
2. Toque START MY JOURNEY. Confira LV. 1, 0/100 XP, Study Day 0/90 e dois tokens. Passe pelo Prologue abaixo antes das quests. Se houver jornada iniciada da versão anterior, ela continua sem Prologue obrigatório.
3. Conclua Train Your Ears na Home: +20 XP. Abra Quests, confira a missão concluída e complete Speak Up (+20) e Knowledge Scroll (+10).
4. Confira DAY COMPLETE, bônus +20 XP, XP total 70, Study Day 1 e streak 1. As próximas quests passam a ser as do Study Day 2.
5. Feche completamente o Expo Go e reabra: XP, Study Day e status continuam salvos, sem novo bônus. Completed guarda as missões anteriores.
6. Conclua Grammar Dungeon, Tell Your Story e Quick Listen. A segunda missão produz LV. 2 com 10/125 XP. Ao completar o dia, ficam 40/125 XP e Study Day 2. Streak permanece 1 se ocorrer no mesmo dia de calendário.
7. Abra Journey e Progress. Confira os cinco mundos, marcos e registros de esforço: esses dois dias somam 33 minutos, sem estimar minutos para a lição.
8. Para acelerar o restante, use o painel abaixo. Dados acelerados ficam explicitamente marcados como desenvolvimento.
9. Após 14 Study Days, entre em THE SILENCE na Home ou Journey. Fale um minuto por etapa e confirme. Confira HP 100, 80, 60, 40, 20 e 0. Fechar/reabrir no meio deve preservar as etapas.
10. Na vitória, confira +150 XP, BOSS SLAYER, I FOUND MY VOICE, World 01 COMPLETED e World 02 UNLOCKED/COMING SOON. Reabrir não recompensa novamente.
11. Para testar retorno, simule sete dias de inatividade. Confira a mensagem acolhedora e Just Come Back. Sua conclusão concede 20 XP e cinco minutos Listening, sem Study Day extra.
12. No painel, escolha RESET JOURNEY, teste Cancel reset e depois confirme conscientemente para limpar os dados de teste e começar sua jornada real.

## Testar Prologue, Time Capsules, Titles e projeção

1. **Prologue:** em uma nova jornada, toque START RECORDING. A permissão de microfone só é solicitada nessa ação. Fale algumas frases, toque STOP, PLAY, RECORD AGAIN se desejar e SAVE TIME CAPSULE. Confira Home liberada e cápsula em Profile. Reabra Expo Go: o áudio e metadata devem permanecer. Se negar permissão, pode continuar sem gravação; nenhuma cápsula falsa será salva. Para refazer o fluxo, use reset confirmado somente após decidir apagar seus dados de teste.
2. **Time Capsule:** Profile → Save a new reflection. Grave e salve; a nova cápsula registra seu Study Day real. Compare reproduções manualmente. PLAY é local; funciona apenas no dispositivo que contém o arquivo. No navegador há mensagem explícita de gravação indisponível, sem pedir microfone nem inventar áudio. O Developer Panel cria apenas placeholder claramente marcado e não reproduzível.
3. **Titles:** complete oito Study Days para VOICE SEEKER e THE RETURNER, ou use o atalho de desbloqueio de título no painel. Confira TITLE UNLOCKED, depois Profile → Equip THE RETURNER. Home mostra o título equipado, inclusive após reabrir. Derrotar THE SILENCE desbloqueia SILENCE BREAKER uma vez.
4. **Projeção:** logo no começo mostra Building your projection. Estude em três datas distintas e observe pelo menos sete dias, ou use Simulate Journey Pace cedo em World 01. Journey mostrará estimativa aproximada em semanas. Simular inatividade pode ampliar a estimativa ou voltar ao estado sem dados suficientes; nenhum progresso é removido.
5. **Produção:** ferramentas de desenvolvimento e reset não aparecem no bundle de produção. Permissões, reprodução e haptics precisam ser confirmados no iPhone real; testes automatizados não dependem de hardware.

## Developer Tools

Somente no Expo em development mode: **Profile → Development tools**.

- Complete Prologue without audio: equivale a continuar sem gravação; não simula áudio.
- Unlock THE RETURNER title: desbloqueio marcado como desenvolvimento, com feedback.
- Advance Chapter through quests: conclui os Study Days restantes do capítulo pelas regras reais; não derrota Boss automaticamente.
- Create Mock Time Capsule (no audio): placeholder idempotente e marcado, sem arquivo ou botão Play.
- Simulate Journey Pace (3 dates): avança sete dias na referência de desenvolvimento e conclui três Study Days em datas distintas, sem reescrever histórico. Disponível antes dos três últimos Study Days de World 01. Pode continuar o Prologue sem áudio durante essa simulação explícita.
- Advance Study Day: conclui as três quests do dia usando as regras reais.
- Add 100 XP: adiciona um registro de XP de desenvolvimento.
- Simulate 7 days inactivity: avança a referência de calendário de teste, sem reescrever o histórico. A referência futura permanece em desenvolvimento após reabrir; reset sai da simulação.
- Add/Remove Rest Token: respeita limites 0–4.
- Unlock Boss through 14 Study Days: completa os dias restantes pelas regras reais; não remove o requisito do Boss.
- RESET JOURNEY: exige Confirm RESET JOURNEY; Cancel reset mantém tudo.

As ações marcam `developmentData`, e Home/Journey/Progress/Profile avisam que dados simulados estão incluídos. O painel e os callbacks de desenvolvimento são bloqueados por `__DEV__`; não aparecem em exportação de produção.

## Limitações reais

- Somente os 14 Study Days e o Boss de World 01 são jogáveis. Worlds 02–05 aparecem na campanha; World 02 é desbloqueado na vitória, com conteúdo futuro.
- Atividades são autodeclaradas. Duração fixa de quest/etapa é registrada ao confirmar; não há avaliação de qualidade. Time Capsule grava áudio separado dessas atividades; não atribui XP nem valida a atividade.
- Metas sem duração, como uma lição, contam quest/XP, mas não minutos. Vocabulary pode permanecer com zero minutos neste pool, mesmo tendo lições concluídas.
- A renovação e o consumo de tokens acontecem quando o app é carregado, volta ao primeiro plano ou processa uma ação. Não há execução em background.
- Mais de um Study Day pode ser concluído por dia de calendário; apenas um incrementa streak.
- Armazenamento permanece local, sem conta, backup remoto ou sincronização entre dispositivos. Remover os dados do app pode apagar a jornada.
- Checkpoints estão somente em modelo/configuração. Nenhuma Skill recebeu score.
- O pool inicial é pequeno e determinístico; os trios se repetem com IDs de Study Day distintos.
- O aviso do debugger desktop neste Linux continua sendo independente do funcionamento do Metro/Expo Go. A alternativa abaixo não altera permissões do sistema.

Capturas da etapa narrativa: [Prologue](docs/narrative-v1/prologue.png), [Quest complete](docs/narrative-v1/quest-complete.png), [Day complete](docs/narrative-v1/day-complete.png), [Journey](docs/narrative-v1/journey.png) e [Title equipado](docs/narrative-v1/profile-title.png).

Capturas do Game System v1: [Home](docs/game-system-v1/home-v1.png), [Journey](docs/game-system-v1/journey-v1.png), [Progress](docs/game-system-v1/progress-v1.png) e [Boss derrotado](docs/game-system-v1/boss-defeated-v1.png).

## Próximo passo

Validar no iPhone gravação/reprodução/reabertura das cápsulas, haptics e clareza dos feedbacks antes de ampliar conteúdo.

## Inicialização no Linux sem o instalador do DevTools

Alternativa opcional para evitar a instalação automática que falha neste Linux: crie um `.env.local` com as opções abaixo. Esse arquivo é ignorado pelo Git e não contém secrets. **Esse modo não exibe QR code nem atalhos interativos.** A configuração não está habilitada por padrão.

```dotenv
EXPO_UNSTABLE_HEADLESS=1
EXPO_NO_DEPENDENCY_VALIDATION=0
EXPO_NO_WEB_SETUP=0
EXPO_NO_NEW_ARCH_COMPAT_CHECK=0
EXPO_UNSTABLE_BONJOUR=1
```

A configuração utiliza uma opção interna do SDK 57 e desativa o debugger desktop independente do React Native. Os checks de dependências, web e arquitetura permanecem habilitados. Execute `npm start -- --port 8082` e abra manualmente no Expo Go o endereço `exp://IP_DO_COMPUTADOR:8082`; substitua o IP pelo endereço do computador na rede Wi-Fi. O preview web continua disponível em `http://localhost:8082`. Para voltar ao QR code e aos atalhos, remova esse bloco do `.env.local`.
