# KITS — a individualidade dos 20 heróis (v45)

> **Esta é a tabela que a reformulação pediu antes de implementar.** Ela existe para
> ser revisada **herói por herói**. Cada linha é uma proposta: se algum kit não
> combinar com o personagem, é aqui que se discute, e a mudança é uma linha em
> `data/catalogo.js` — nenhuma delas exige mexer no motor.
>
> **Nada de narrativa mudou.** Nome, epíteto, aparência, profissão, arma,
> personalidade, rota, classe e referência de kit são exatamente os de antes. As
> mecânicas nasceram do conceito que já existia — o status foi adaptado ao
> personagem, nunca o contrário.

## O problema que isto resolve

Antes da v45 a diferença entre dois heróis era **quanto** de dano, **quanta** vida e
**quanto** de alcance. Dezoito dos vinte tinham uma habilidade básica cuja regra
inteira era "causa dano", e catorze tinham uma Ultimate que era a básica com um
número maior. Trocar de herói mudava a planilha, não a partida.

Agora **enfrentar cada herói faz uma pergunta diferente**:

| Você está jogando contra | A pergunta que aparece na mesa |
|---|---|
| Dona Chinela | "Quantos acúmulos de Sangramento eu já tenho? Ainda dá para ficar?" |
| O Taxista | "Se eu encostar, ele me atordoa. Vale entrar?" |
| Pombo Ciborgue | "Ele desapareceu. Compro uma Ward ou ando acompanhado?" |
| Arden, o Juiz | "Com o que eu acerto ele sem entregar a minha melhor habilidade?" |
| Ilva | "Estou envenenado. Continuo lutando ou recuo?" |
| Corvo | "Ele já deu três tiros. O próximo é Crítico — saio agora." |
| Cael | "Não pisa na armadilha: travado, ele crita." |
| Zhet | "Ela sumiu do tabuleiro, mas volta na mesma casa. Espero." |
| Catarino | "Duas marcas. Na terceira o cilindro estoura — tenho um turno." |
| Torvald | "Não morre ninguém perto dele, senão ele vira muro." |

---

## A regra de complexidade

Cada herói tem **uma ideia principal** e **uma ou duas interações secundárias**.
Nada além disso. A passiva cabe numa frase — "quando X acontece, Y acontece" — e
o teste `passiva cabe numa frase (§14)` reprova qualquer uma que passe de 150
caracteres ou de duas frases.

**Doze condições no jogo, e nenhuma a mais** (o desenho pediu 8 a 12). Cada uma é
reutilizada por vários heróis de maneiras diferentes, em vez de cada herói ter um
status exclusivo:

🩸 Sangramento · ☠️ Veneno · 🐌 Lentidão · ⭐ Atordoamento · 🌀 Banimento ·
👁️ Invisibilidade · 🎯 Marcado · 💢 Vulnerável · 🤐 Silenciado · 🛡️ Tenacidade ·
📡 Revelado · 💠 Marca do Catarino

E **seis recursos de personagem**, que são de um herói só e não viram status
universal: ⚡ Carga (Parabólica) · ♻️ Sucata (Gari Mago) · 🖤 Tristeza (Emerson
Emo) · 🔸 Cartucho (Corvo) · 🎈 Fôlego (Zé Griteco) · 🔗 Almas (Torvald). Mais os
⚖ Autos do Juiz, que são o registro da cópia do Arden.

---

## TOPO · A Ilha

| Herói | Ideia mecânica | Passiva | Básica | Segunda | Ultimate | Condições | Contrajogo |
|---|---|---|---|---|---|---|---|
| **O Taxista**<br>*o Piloto da Quebrada*<br><sub>Tanque · ref. Ornn / Sion</sub><br><sub>V25 P3 A3 Alc1</sub> | O dono do espaço. Perto dele o tabuleiro fica lento, e ele é o único que ATORDOA. | **✦ Ponto de Ônibus**<br>No início do turno dele, todo inimigo colado fica Lento. | **Martelo Carburado** (F1)<br>Dano = **Força + Poder − Armadura** · Aplica 💢 **Vulnerável** | **Buzina Infernal** (F3)<br>Dano = **Força + Poder − Armadura** · Aplica ⭐ **Atordoamento** · Puxa o alvo **1** casa na sua direção | **Escudo de Porta** (F6)<br>Escudo de **Força + 6** · Ele mesmo ganha 🛡️ **Tenacidade** por 2 turnos · **Prende** todos os inimigos adjacentes | 💢 Vulnerável<br>⭐ Atordoamento<br>🛡️ Tenacidade<br>🐌 Lentidão | Alcance 1 e nada de mobilidade — ele precisa que você venha. A Buzina exige dado 3+ e adjacência; gasta ela e você tem uma janela. Tenacidade anula o atordoamento, e sair de um já deixa Tenacidade. |
| **Dona Chinela**<br>*a Justiça de Borracha*<br><sub>Lutador · ref. Darius</sub><br><sub>V22 P3 A2 Alc1</sub> | Empilha Sangramento e cobra a conta: quanto mais o alvo sangra, mais alto o chinelo executa. | **✦ Chinelada**<br>Todo golpe dela deixa 1 acúmulo de Sangramento no alvo. | **Chinelada** (F1)<br>Dano = **Força + Poder − Armadura** · **+3** se o alvo já estiver ferido | **Puxão de Orelha** (F3)<br>Dano = **Força + Poder − Armadura** · Aplica 🩸 **Sangramento** ×2 · Puxa o alvo **1** casa na sua direção | **Chinelo Voador** (F5)<br>Dano = **Força + Poder − Armadura** · **Consome** o 🩸 **Sangramento** do alvo: **+3** de dano por acúmulo · Elimina na hora um alvo com **5** ou menos de vida · e o limiar sobe **+3** por acúmulo de 🩸 **Sangramento** no alvo | 🩸 Sangramento | O Sangramento decai 1 por turno: recuar apaga a conta que ela abriu. Alcance 1, sem mobilidade nenhuma. O limiar da execução está escrito na peça — dá para saber quando você saiu do alcance dele. |
| **Ilva**<br>*a Portadora*<br><sub>Mago · ref. Gwen / Mordekaiser</sub><br><sub>V20 P4 A2 Alc2</sub> | Espalha Veneno e depois colhe: a Ceifa bate muito mais forte em quem já está envenenado. | **✦ Miasma**<br>No início do turno dela, todo inimigo colado é Envenenado por 1 turno. | **Chama Espectral** (F1)<br>Dano = **Força + Poder − Armadura** · Se o alvo estiver ☠️ **Veneno**, **espalha** para os vizinhos dele | **Véu de Névoa** (F3)<br>Escudo de **Força + 5** · **Zona** — cobre **1** de raio pelos **2 próximos turnos do adversário**: quem começar o turno dentro fica **Envenenado** | **Ceifa** (F5)<br>Dano = **Força + Poder − Armadura** · **+4** se o alvo estiver ☠️ **Veneno** · Atinge também os vizinhos do alvo | ☠️ Veneno | O Veneno tem prazo, e limpeza (Digerir, Empresta o Fone, Varrida) tira. Não fique colado nela: o Miasma só pega adjacente. Sem alvo envenenado a Ceifa é uma Ultimate comum. |
| **Xhera**<br>*a Insaciável*<br><sub>Lutador · ref. Aatrox / Riven</sub><br><sub>V22 P4 A2 Alc1</sub> | Paga com a própria vida e recompra bebendo a do outro. Quanto mais ferida, mais forte. | **✦ Insaciável**<br>Cura 2 sempre que causa dano. Abaixo de metade da vida, cura 4 e ganha +2 de Poder. | **Lâmina Sedenta** (F1)<br>Dano = **Força + Poder − Armadura** | **Investir** (F3)<br>Dano = **Força + Poder − Armadura** · **+3** de dano · Aplica 💢 **Vulnerável** · Puxa o alvo **1** casa na sua direção | **Sede Final** (F5)<br>Dano = **Força + Poder − Armadura** · **+4** de dano · **Paga 3 da própria vida** · **+3** se o alvo já estiver ferido · **Drena** — cura o mesmo tanto que causou de dano | 💢 Vulnerável | Grilhão de Cinzas e qualquer 'sem cura' desligam o kit inteiro. Ela paga vida para bater: negar a cura transforma a força dela em preço. Alcance 1. |

## SELVA · O Caçador

| Herói | Ideia mecânica | Passiva | Básica | Segunda | Ultimate | Condições | Contrajogo |
|---|---|---|---|---|---|---|---|
| **Pombo Ciborgue**<br>*o Correio da Sarjeta*<br><sub>Assassino · ref. Kha'Zix / Rengar</sub><br><sub>V18 P3 A1 Alc1 · ágil</sub> | Desaparece. Você não sabe onde ele está, e ele bate Crítico em quem andou sozinho. | **✦ Voo Silencioso**<br>No início do turno dele, se nenhum inimigo estiver colado, ele fica Invisível. | **Bicada** (F1)<br>Dano = **Força + Poder − Armadura** · **+2** de dano · **CRÍTICO** (1.5×) se o alvo não tiver aliado a 2 casas | **Voo Rasante** (F3)<br>Ele mesmo ganha 👁️ **Invisibilidade** por 2 turnos | **Rasante Final** (F5)<br>Dano = **Força + Poder − Armadura** · **+3** de dano · Elimina na hora um alvo com **6** ou menos de vida · **CRÍTICO** (1.5×) se ele atacou estando Invisível | 👁️ Invisibilidade | Ward revela — mas ela obedece à regra do mato, e ele vive no mato: **plante dentro do bolsão**, ward na rota ao lado não enxerga lá. Atacar entrega a posição. 18 de vida e 1 de armadura: quando aparece, morre rápido. O Crítico dele exige alvo isolado — andar acompanhado desliga metade do kit. |
| **Grumo**<br>*o Devorador*<br><sub>Tanque · ref. Sejuani / Zac</sub><br><sub>V23 P3 A3 Alc1</sub> | Digere tudo: veneno, sangramento e cadáver. O tanque que não fica com condição pendurada. | **✦ Digestão**<br>Cura 4 quando qualquer herói morre a até 2 casas dele. | **Investida** (F1)<br>Dano = **Força + Poder − Armadura** · Aplica 🐌 **Lentidão** · Empurra o alvo **1** casa | **Digerir** (F2)<br>Cura **7** · **+3** de ouro · **Limpa todas** as condições ruins dele mesmo | **Avalanche** (F5)<br>Atinge **todos** os inimigos adjacentes · Aplica em **todos** os inimigos adjacentes: 🐌 **Lentidão** · **Prende** todos os inimigos adjacentes | 🐌 Lentidão | Alcance 1 e nenhum dano de pico: ele não mata, ele aguenta. Não morra perto dele (a Digestão cura 4 por morte) e não conte com condição pendurada para vencê-lo. |
| **Valti**<br>*o Homem do Coco*<br><sub>Assassino · ref. Nidalee / Elise</sub><br><sub>V18 P3 A1 Alc2 · ágil</sub> | Prepara terreno. O coco só atordoa quem pisou nas cascas — o Atordoamento tem endereço. | **✦ Olho de Mateiro**<br>Enxerga dentro do mato de qualquer lugar do tabuleiro. | **Facão** (F1)<br>Dano = **Força + Poder − Armadura** · Aplica 🩸 **Sangramento** | **Talho de Facão** (F2)<br>Dano = **Força + Poder − Armadura** · **Zona** — cobre **1** de raio pelos **2 próximos turnos do adversário**: quem começar o turno dentro recebe 🐌 **Lentidão** | **Coco na Cabeça** (F5)<br>Dano = **Força + Poder − Armadura** · **+2** de dano · Aplica **só se o alvo estiver dentro de uma zona dele**: ⭐ **Atordoamento** | 🩸 Sangramento<br>🐌 Lentidão<br>⭐ Atordoamento | O Atordoamento tem endereço: sem pisar na zona de cascas, o Coco é só dano. As zonas são visíveis no chão — sair delas é o contrajogo, e é gratuito. |
| **Pyk**<br>*o Coveiro*<br><sub>Assassino · ref. Pyke</sub><br><sub>V18 P4 A2 Alc2 · ágil</sub> | Marca, arrasta e executa. Contra ele a pergunta é sempre a mesma: dá para morrer daqui? | **✦ Contabilidade do Coveiro**<br>Quando ele mata, leva +3 de ouro e o aliado mais próximo leva +2. | **Arpão** (F1)<br>Dano = **Força + Poder − Armadura** · Aplica 🎯 **Marcado** ×3 | **Puxada Funda** (F3)<br>Dano = **Força + Poder − Armadura** · Aplica 🐌 **Lentidão** · Puxa o alvo **3** casas na sua direção · Alcance **+2** nesta habilidade | **Cova** (F5)<br>Dano = **Força + Poder − Armadura** · Elimina na hora um alvo com **7** ou menos de vida · limiar **+4** se o alvo estiver 🎯 **Marcado** · **+3** de ouro se matar | 🎯 Marcado<br>🐌 Lentidão | Fique acima do limiar. A Marca é visível na peça e o limiar sobe 4 com ela: dá para contar. Tenacidade barra a Lentidão da Puxada, e 18 de vida fazem dele um alvo. |

## MEIO · O Relógio

| Herói | Ideia mecânica | Passiva | Básica | Segunda | Ultimate | Condições | Contrajogo |
|---|---|---|---|---|---|---|---|
| **Parabólica Diabólica**<br>*que capta até o que não existe*<br><sub>Mago · ref. Lux / Syndra</sub><br><sub>V18 P3 A1 Alc3</sub> | Junta Carga para o Crítico e TRANCA habilidade: perto dela a sua Ultimate pode não sair. | **✦ Captação**<br>Ganha 1 Carga a cada golpe. Com 3 Cargas, o golpe seguinte é Crítico e gasta as Cargas. | **Raio Diabólico** (F1)<br>Dano = **Força + Poder − Armadura** | **Interferência** (F4)<br>Dano = **Força + Poder − Armadura** · Atinge também os vizinhos do alvo · Aplica 🤐 **Silenciado** | **Sinal Aberto** (F6)<br>Dano = **Força + Poder − Armadura** · **Perfurante** — **ignora a Armadura** do alvo. Em troca, escala mais devagar que uma Ultimate comum · **Revela** todo inimigo a até **4** casas — inclusive no mato e sob Invisibilidade | 🤐 Silenciado<br>📡 Revelado<br>⚡ Carga | Alcance 3 mas 18 de vida e 1 de armadura — encostar nela resolve. A contagem de Carga fica visível: com 3 Cargas o próximo golpe é Crítico, e você pode recuar um turno. |
| **Zhet**<br>*a Lâmina de Três Sombras*<br><sub>Assassino · ref. Zed / Talon</sub><br><sub>V18 P4 A1 Alc1 · ágil</sub> | Troca de lugar com você e some do tabuleiro. Nunca está onde você bateu. | **✦ Passo de Sombra**<br>Depois de causar dano, ele recua 1 casa de graça. | **Estocada** (F1)<br>Dano = **Força + Poder − Armadura** | **Eco** (F2)<br>Dano = **Força + Poder − Armadura** · **Troca de lugar** com o alvo · Aplica 🎯 **Marcado** ×4 | **Trio de Sombras** (F5)<br>Dano = **Força + Poder − Armadura** · Atinge também os vizinhos do alvo · 🌀 **Ele mesmo é Banido** por 1 turno: sai do tabuleiro e volta no mesmo lugar no início do próprio turno | 🎯 Marcado<br>🌀 Banimento | Enquanto Banida ela não faz nada, e volta na MESMA casa: dá para esperá-la. O Eco troca de lugar — às vezes a troca é boa para você. 18 de vida. |
| **Gari Mago**<br>*o Guardião da Limpeza*<br><sub>Mago · ref. Orianna / Anivia</sub><br><sub>V18 P3 A1 Alc3</sub> | Limpa os aliados e acumula Sucata. A Ultimate dele vale o que ele varreu na partida. | **✦ Coleta**<br>Ganha 1 Sucata a cada golpe e a cada herói que morre a até 3 casas. Máximo 5. | **Varrida Purificadora** (F1)<br>Dano = **Força + Poder − Armadura** · **Limpa 1** condição ruim de cada aliado adjacente | **Redemoinho Sustentável** (F3)<br>Dano = **Força + Poder − Armadura** · Aplica 🐌 **Lentidão** · **Prende** o alvo nesta rodada | **Coleta Seletiva Suprema** (F5)<br>Dano = **Força + Poder − Armadura** · **+2** por ♻️ **Sucata** acumulada, e **gasta tudo** · Atinge também os vizinhos do alvo · **Zona** — cobre **1** de raio pelos **2 próximos turnos do adversário**: quem começar o turno dentro fica **Envenenado** | 🐌 Lentidão<br>☠️ Veneno<br>♻️ Sucata | A Sucata fica visível: dá para saber o tamanho da Ultimate antes de ela sair. Alcance 3 mas 18 de vida. Sem golpes acertando, ele não acumula nada. |
| **Arden**<br>*o Juiz*<br><sub>Mago · ref. Swain / Cassiopeia</sub><br><sub>V22 P3 A2 Alc2</sub> | COPIA. Ele guarda a última habilidade que te viu usar contra ele e devolve. | **✦ Jurisprudência**<br>Guarda a última habilidade inimiga que o acertou. Ultimate não entra nos autos. | **Sentença** (F1)<br>Dano = **Força + Poder − Armadura** | **Drenar** (F2)<br>Dano = **Força + Poder − Armadura** · Cura **5** · Aplica ☠️ **Veneno** por 2 turnos | **Tribunal** (F5)<br>Atinge todos os inimigos a até **3** casas · **COPIA** — repete contra o alvo a última habilidade inimiga registrada pela Jurisprudência, com o Poder dele. **Ultimate inimiga nunca entra**; sem registro, vira dano em raio | ☠️ Veneno | Escolha com que acertá-lo — a Ultimate dele nunca copia a sua Ultimate, e os autos ficam visíveis na ficha. Bater com a básica alimenta o Tribunal; bater com a Ultimate não. |

## ATIRADOR · O Investimento

| Herói | Ideia mecânica | Passiva | Básica | Segunda | Ultimate | Condições | Contrajogo |
|---|---|---|---|---|---|---|---|
| **Zé Griteco**<br>*o Regente das Gemas*<br><sub>Atirador · ref. Jinx / Kog'Maw</sub><br><sub>V20 P3 A1 Alc3 · escala</sub> | Rampa. Se ele te escolher e você não sair, cada turno dele dói mais que o anterior. | **✦ Pulmão de Aço**<br>Cada golpe seguido no MESMO alvo dá +1 Fôlego (+2 de dano cada). Trocar de alvo zera. | **Ovada Surpresa** (F1)<br>Dano = **Força + Poder − Armadura** · Aplica 💢 **Vulnerável** | **Encher o Pulmão** (F2)<br>O próximo golpe leva **+6** · **Alcance +1** até o próximo turno dele | **Caminhão Fantasma** (F5)<br>Atinge todos os inimigos a até **3** casas · Aplica em **todos** os inimigos no raio: 🐌 **Lentidão** | 💢 Vulnerável<br>🐌 Lentidão<br>🎈 Fôlego | Saia de perto ou troque quem apanha: mudar de alvo zera o Fôlego dele. Alcance 3 mas nenhuma mobilidade — quem encosta ganha. |
| **Cael**<br>*o Cobrador*<br><sub>Atirador · ref. Caitlyn / Draven</sub><br><sub>V18 P3 A1 Alc3</sub> | Armadilha primeiro, Crítico depois. Ele não crita por sorte — crita em quem ele travou. | **✦ Juros**<br>Crítico contra alvo Preso, Atordoado ou Lento. | **Cobrança** (F1)<br>Dano = **Força + Poder − Armadura** · **+2** de ouro se matar | **Armadilha** (F2)<br>Dano = **Força + Poder − Armadura** · **+2** de dano · **Zona** — cobre **1** de raio pelos **2 próximos turnos do adversário**: quem começar o turno dentro recebe 🐌 **Lentidão** | **Sentença** (F5)<br>Dano = **Força + Poder − Armadura** · **Perfurante** — **ignora a Armadura** do alvo. Em troca, escala mais devagar que uma Ultimate comum · Alcance **+2** nesta habilidade | 🐌 Lentidão | Não deixe que ele te trave. O Crítico exige Preso, Atordoado ou Lento — sem controle, ele é um atirador comum. A Armadilha é uma zona visível no chão. |
| **Catarino**<br>*o Menino do Cilindro*<br><sub>Atirador · ref. Vayne / Kai'Sa</sub><br><sub>V18 P3 A1 Alc3 · ágil · escala</sub> | Três marcas e o cilindro estoura. Contra ele conta-se de três em três, não de vida em vida. | **✦ Marca do Catarino**<br>Todo golpe dele deixa 1 Marca. Na terceira, 5 de dano que ignora armadura e escudo. | **Jato de Oxigênio** (F1)<br>Dano = **Força + Poder − Armadura** | **Puff de Emergência** (F2)<br>Escudo de **Força + 4** · **Recua até 2 casas** de graça, sem gastar movimento | **Crise Alérgica** (F5)<br>Dano = **Força + Poder − Armadura** · Elimina na hora um alvo com **5** ou menos de vida · limiar **+4** se o alvo estiver 💠 **Marca do Catarino** | 💠 Marca do Catarino | Conte de três em três: a Marca aparece na peça. Duas marcas e você tem um turno para sair. 18 de vida e 1 de armadura. |
| **Corvo**<br>*o Marcador*<br><sub>Atirador · ref. Jhin / Senna</sub><br><sub>V18 P3 A1 Alc3 · escala</sub> | Quatro tiros. O quarto é Crítico, e ele escolhe QUANDO — o Recarregar adianta a conta. | **✦ Quatro Tiros**<br>Conta os golpes: o quarto sai Crítico e zera a contagem. | **Tiro Marcado** (F1)<br>Dano = **Força + Poder − Armadura** · Aplica 🎯 **Marcado** ×3 | **Recarregar** (F2)<br>O próximo golpe leva **+6** · Enche 🔸 **Cartucho** até **3** | **Ato Final** (F5)<br>Dano = **Força + Poder − Armadura** · **Perfurante** — **ignora a Armadura** do alvo. Em troca, escala mais devagar que uma Ultimate comum · **Sempre CRÍTICO** (1.5×) · **Revela** todo inimigo a até **4** casas — inclusive no mato e sob Invisibilidade | 🎯 Marcado<br>🔸 Cartucho<br>📡 Revelado | Conte os tiros — o Cartucho fica visível na peça, e o quarto é Crítico. Depois do Recarregar, o próximo golpe é o grande: essa é a hora de não estar lá. |

## SUPORTE · A Memória

| Herói | Ideia mecânica | Passiva | Básica | Segunda | Ultimate | Condições | Contrajogo |
|---|---|---|---|---|---|---|---|
| **Emerson Emo**<br>*a Trilha Sonora*<br><sub>Suporte · ref. Lulu / Janna</sub><br><sub>V20 P2 A2 Alc3</sub> | Transforma coisa ruim em vantagem: quanto mais o time dele apanha, mais forte ele cura. | **✦ Tristeza**<br>Ganha 1 Tristeza quando um aliado sofre dano (máx 5). Cura e escudo dele levam +1 por Tristeza. | **Ombro Amigo** (F1)<br>Escudo de **Força + 4** · Cura **5** · **+1** na cura e no escudo por 🖤 **Tristeza**, e **gasta tudo** | **Empresta o Fone** (F1)<br>**Limpa 1** condição ruim do alvo · **Doa este dado** para um aliado usar como se fosse dele | **Ninguém Me Entende** (F4)<br>Escudo de **Força + 5** · Cura **7** · Um aliado morto **volta 1 rodada antes** · Aplica nos aliados adjacentes: 🛡️ **Tenacidade** por 2 turnos | 🛡️ Tenacidade<br>🖤 Tristeza | Poder 2 e nenhum dano: mate-o primeiro ou negue a cura (Grilhão). A Tristeza sobe quando o time dele apanha — pressão espalhada alimenta o suporte em vez de matar. |
| **Torvald**<br>*a Corrente*<br><sub>Suporte · ref. Thresh / Nautilus</sub><br><sub>V22 P3 A3 Alc1</sub> | Colhe alma de quem morre por perto e endurece a partida inteira. Começa frágil, termina muro. | **✦ Almas na Lanterna**<br>Cada herói que morre a até 3 casas dele dá +1 de Armadura permanente, até +5. | **Ward** (F1)<br>**Ward** — posta um olho aqui: acende 3 de raio por 3 rodadas | **Gancho** (F3)<br>Dano = **Força + Poder − Armadura** · Aplica 🐌 **Lentidão** · Puxa o alvo **3** casas na sua direção · Alcance **+2** nesta habilidade | **Cerco** (F5)<br>Atinge **todos** os inimigos adjacentes · Escudo de **5** em cada aliado adjacente · **Prende** todos os inimigos adjacentes | 🐌 Lentidão<br>🔗 Almas | Não morra perto dele: cada morte a 3 casas vale +1 de Armadura permanente. Começa frágil — a janela é cedo. Alcance 1 fora do Gancho. |
| **Caramêlo 2.0**<br>*o Cachorro Pilotado*<br><sub>Suporte · ref. Braum / Alistar</sub><br><sub>V25 P3 A4 Alc1</sub> | Corpo na frente. Aliado colado nele custa 2 de dano a menos para o adversário. | **✦ Guarda-Corpo**<br>Aliado colado nele sofre 2 de dano a menos. | **Latido** (F1)<br>Dano = **Força + Poder − Armadura** · Aplica 🐌 **Lentidão** · Empurra o alvo **1** casa | **Escudo de Pelo** (F1)<br>Escudo de **Força + 4** · Aplica 🛡️ **Tenacidade** por 2 turnos | **Latido Caótico** (F5)<br>Atinge **todos** os inimigos adjacentes · Empurra **todos** os inimigos adjacentes 1 casa · **Prende** todos os inimigos adjacentes | 🐌 Lentidão<br>🛡️ Tenacidade | Separe o time dele: a redução de 2 só vale para aliado colado. Alcance 1 e quase nenhum dano — ele não fecha partida sozinho. |
| **Vidra**<br>*a Vidente*<br><sub>Suporte · ref. Karma / Janna</sub><br><sub>V18 P2 A2 Alc3</sub> | A resposta ao invisível. Ela não bate forte: ela diz onde o outro está. | **✦ Vidência**<br>No início do turno dela, o inimigo escondido mais próximo (até 4 casas) fica Revelado. | **Presságio** (F1)<br>**Ward** — posta um olho aqui: acende 3 de raio por 3 rodadas · **Revela** todo inimigo a até **3** casas — inclusive no mato e sob Invisibilidade | **Empréstimo** (F1)<br>**Doa este dado** para um aliado usar como se fosse dele | **Vento Contrário** (F4)<br>Escudo de **Força + 5** · Aplica 🛡️ **Tenacidade** por 2 turnos · Empurra 1 casa **todo inimigo colado no aliado** | 📡 Revelado<br>🛡️ Tenacidade | Poder 2, 18 de vida, nenhum dano relevante. Ela é informação, não ameaça: mate-a e a Invisibilidade do adversário volta a funcionar. |

---

## Como cada condição foi distribuída

O critério não foi "dar um status a cada um". Foi: **quantos heróis precisam desta
condição para a identidade deles funcionar, e quantos precisam sofrê-la para o
contrajogo existir**.

| Condição | Quem aplica | Por que esses |
|---|---|---|
| 🩸 Sangramento | Dona Chinela (passiva + segunda + Ultimate), Valti (básica) | É o recurso que a Dona Chinela **empilha e cobra**. No Valti é migalha: 1 acúmulo por facão, o suficiente para marcar quem passou por ele |
| ☠️ Veneno | Ilva (passiva, zona, Ultimate), Arden (Drenar), Gari Mago (zona) | Dano constante, prazo curto: é doença, não ferimento. Os três são magos de desgaste |
| 🐌 Lentidão | Taxista, Grumo, Valti, Pyk, Zé Griteco, Cael, Torvald, Caramêlo | A condição mais espalhada de propósito: ela é **cola de kit**, não assinatura. É o que faz o Crítico do Cael e o Coco do Valti terem endereço |
| ⭐ Atordoamento | Taxista (segunda), Valti (Ultimate, só na armadilha) | **Dois heróis, e só dois.** Controle forte precisa ser raro. O do Valti exige pré-requisito no chão |
| 🌀 Banimento | Zhet (nela mesma) | **Um herói.** É a assinatura dela e o efeito mais raro do jogo — aparece em ~14% das partidas |
| 👁️ Invisibilidade | Pombo Ciborgue (passiva + segunda) | **Um herói.** "Ele desapareceu" só é uma pergunta interessante se for um personagem, não uma opção de todo mundo |
| 🎯 Marcado | Pyk, Zhet, Corvo | Preparação: os três marcam para cobrar depois — o Pyk com execução mais alta, a Zhet com dano, o Corvo com o quarto tiro |
| 💢 Vulnerável | Taxista, Xhera, Zé Griteco | Abre a guarda para o resto do time. Vive em quem entra primeiro |
| 🤐 Silenciado | Parabólica Diabólica | **Um herói.** "Interferência" é literalmente o conceito dela, e trancar a Ultimate do adversário é forte demais para dois |
| 🛡️ Tenacidade | Taxista, Emerson Emo, Caramêlo, Vidra — **e a regra**, automática ao sair de um atordoamento | É o antídoto de controle. Mora no suporte, porque é o suporte quem protege |
| 📡 Revelado | Parabólica, Corvo, Vidra — e a carta Contra-emboscada | É o contrajogo da Invisibilidade, e precisa existir **fora** do draft: qualquer time compra a carta |
| 💠 Marca do Catarino | Catarino | Marca de personagem: só ele aplica, mas usa a mesma máquina das outras |

---

## O que a medição diz

`node sim/condicoes.js 200` dirige a **IA de verdade** nos dois lados, sorteando os
vinte heróis, e olha o tabuleiro ao fim de cada turno. Em 200 partidas:

| Condição | heróis-turno por partida | Partidas em que apareceu |
|---|---|---|
| 🐌 Lentidão | 26,3 | 99% |
| 👁️ Invisibilidade | 18,2 | 57% |
| 🛡️ Tenacidade | 17,7 | 94% |
| ☠️ Veneno | 13,3 | 73% |
| 📡 Revelado | 12,9 | 97% |
| 🩸 Sangramento | 8,4 | 57% |
| 💢 Vulnerável | 6,8 | 84% |
| ⭐ Atordoamento | 6,4 | 62% |
| 🎯 Marcado | 6,3 | 68% |
| 🤐 Silenciado | 3,6 | 49% |
| 💠 Marca do Catarino | 1,7 | 37% |
| 🌀 Banimento | 0,4 | 14% |

**Nenhuma condição é código morto**, e os seis recursos chegam ao teto do registro
em jogo real. A escada é a intenção: Lentidão é clima, Banimento é evento.

---

## O que ainda é decisão de vocês

1. **Cada kit, um por um.** A tabela acima é proposta. Trocar um efeito é editar uma
   linha do catálogo.
2. **A Lentidão está em oito heróis.** Foi de propósito (ela é cola), mas se na mesa
   parecer que todo mundo está sempre lento, o corte natural é tirar do Grumo e do
   Caramêlo, que já têm empurrão.
3. **O Banimento aparece em 14% das partidas.** Se parecer raro demais para valer a
   regra, a alavanca é o custo da Ultimate da Zhet (F5), não a duração.
4. **Vidra ficou como resposta dedicada à Invisibilidade.** Se isso a tornar
   obrigatória no draft contra o Pombo, a resposta é ampliar a revelação (mais
   fontes), nunca enfraquecer a Invisibilidade — que já paga com 18 de vida.
