# Como testar esta versão

`JOGAR.html` é o pacote offline gerado. Baixe o arquivo e abra no navegador; não edite esse HTML diretamente.

Para gerar e validar tudo a partir das fontes:

```bash
npm run atualizar
```

## Roteiro de playtest v15.2

1. Abra uma partida rápida e confirme a ordem Azul → Carmim → Azul.
2. Selecione e feche heróis: o mapa não deve mudar de tamanho.
3. Toque numa habilidade: o mapa deve mostrar o alcance, mesmo sem alvo.
4. Aproxime heróis de uma torre, toque nela e siga a instrução de ataque. Use heróis/dados diferentes para golpear a mesma torre na rodada.
5. Toque num acampamento. Ele deve explicar que a coleta ocorre ao entrar na casa; mova um herói para a casa e confira o ouro.
6. Crie escudo, receba dano maior que ele e confirme que o excedente atravessa. O restante expira no fim da rodada.
7. Encerre com recursos sobrando: a confirmação deve dizer para qual time a vez será passada.

Registre aparelho, tamanho da tela, rodada, herói, habilidade e sequência exata de toques quando algo falhar.
