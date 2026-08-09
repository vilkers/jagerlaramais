#!/bin/bash
# Gera a arte do Jagerlaramais via Higgsfield (nano_banana_pro).
# Uso: ./gerar.sh [herois|itens|monstros|mapa|tudo]
cd "$(dirname "$0")"
mkdir -p herois itens monstros mapa

EST="dark fantasy game card illustration, painterly digital art, desaturated palette of deep petrol green teal and antique brass gold, dramatic rim light, volumetric haze, high detail, ominous mood, no text, no watermark, no logo, no signature"
RETRATO="character portrait, chest-up, facing viewer, dark misty background, $EST"
OBJ="single object centered on dark stone surface, museum lighting, $EST"

gera(){ # $1=pasta $2=arquivo $3=proporcao $4=prompt
  local out="$1/$2.png"
  [ -f "$out" ] && { echo "· já existe $2"; return; }
  local url
  url=$(higgsfield generate create nano_banana_pro --prompt "$4" \
        --aspect_ratio "$3" --resolution 2k --wait --wait-timeout 6m 2>&1 | grep -o 'https://[^ ]*\.png' | head -1)
  if [ -n "$url" ]; then curl -sL "$url" -o "$out" && echo "✓ $2"; else echo "✗ $2 FALHOU"; fi
}

herois(){
  # TOPO — a ilha, duelistas isolados
  gera herois draska 4:5 "female ice-blade duelist, sleek segmented armor, frost-etched rapier, cold blue scar across cheek, $RETRATO"
  gera herois orbek  4:5 "hulking stone golem warrior, cracked granite skin with glowing amber veins, mossy shoulders, $RETRATO"
  gera herois sarn   4:5 "scarred renegade juggernaut, heavy plate armor, torn banner cape, greatsword over shoulder, $RETRATO"
  gera herois ilva   4:5 "veiled sorceress-knight, black lace mask, spectral green flame around gauntlet, $RETRATO"
  # SELVA — a sombra, emboscada
  gera herois kurr   4:5 "feral tracker hunter, antler headdress, bone-tipped spear, war paint, crouching predatory, $RETRATO"
  gera herois thane  4:5 "massive lumbering ooze-titan, translucent green gel body with stone shards suspended inside, $RETRATO"
  gera herois vixa   4:5 "shadow assassin woman, smoke dissolving her silhouette, twin curved daggers, glowing violet eyes, $RETRATO"
  gera herois morgo  4:5 "starving beast-man, iron muzzle clamp, matted fur, chain leash broken, snarling, $RETRATO"
  # MEIO — o relógio, controle e alcance
  gera herois nira   4:5 "weaver mage, floating brass orbs orbiting her hands, silk threads of light, serene, $RETRATO"
  gera herois vysh   4:5 "ascended artillery mage, no lower jaw, arcane runes hovering as a halo, robes of dark teal, $RETRATO"
  gera herois sombro 4:5 "trickster assassin youth, blurred afterimages of himself, oversized hood, mischievous grin, $RETRATO"
  gera herois arden  4:5 "grim judge sorcerer, ravens made of shadow, heavy collar of office, glowing crimson sigil, $RETRATO"
  # ATIRADOR — o investimento, escala
  gera herois lyra   4:5 "archer marksman woman, frost-glass bow, fur mantle, calm calculating gaze, $RETRATO"
  gera herois bruk   4:5 "manic gunner with an oversized brass cannon, goggles, soot-stained grin, $RETRATO"
  gera herois nessa  4:5 "agile crossbow duelist, wide-brim hat, silver bolts, coiled to spring, $RETRATO"
  gera herois corvo  4:5 "masked marksman, porcelain crow mask, ornate long rifle, theatrical stance, $RETRATO"
  # SUPORTE — a memória, recursão e visão
  gera herois elna   4:5 "gentle lantern-bearer healer, floating brass lantern, warm green glow, tired kind eyes, $RETRATO"
  gera herois gorm   4:5 "mountainous shield-bearer, enormous iron door as a shield, braided beard, jovial, $RETRATO"
  gera herois iseu   4:5 "strange whispering wanderer, too many eyes on the cloak, chimes floating around, unsettling calm, $RETRATO"
  gera herois vera   4:5 "anchor-wielding warden woman, heavy chain and grappling anchor, storm-lit armor, $RETRATO"
}

itens(){
  gera itens presagio  1:1 "heavy iron pauldron sigil, dense black metal with brass rivets, $OBJ"
  gera itens runa      1:1 "floating obsidian rune stone cracked with violet void light, $OBJ"
  gera itens lente     1:1 "brass spyglass lens with amber crystal, engraved rings, $OBJ"
  gera itens botas     1:1 "worn leather boots with glowing rune stitching and small brass wings, $OBJ"
  gera itens calice    1:1 "broken stone chalice leaking luminous green fluid, $OBJ"
  gera itens elmo      1:1 "ornate commander helm with brass laurel crown, teal plume, $OBJ"
  gera itens espectro  1:1 "translucent ghostly cloak clasp, smoke curling from it, $OBJ"
  gera itens grilhao   1:1 "ash-covered iron shackle with a snapped chain, embers inside, $OBJ"
  gera itens couraca   1:1 "bone breastplate ribbed with jagged spikes, $OBJ"
  gera itens ampuldour 1:1 "golden hourglass with swirling starlight sand, ornate brass frame, $OBJ"
}

monstros(){
  gera monstros dragao   4:3 "ancient elemental dragon perched on a river cliff, wings half spread, scales like wet slate, amber eyes, epic, $EST"
  gera monstros arauto   4:3 "colossal armored herald beast, single glowing eye, siege-ram horns, standing in a misty river bed, $EST"
  gera monstros sentinela 1:1 "large crystalline sentinel beast made of glowing blue quartz, calm and heavy, forest camp, $EST"
  gera monstros fera     1:1 "brutish crimson fire-beast with molten cracks in its hide, snarling, forest camp, $EST"
  gera monstros ninhada  1:1 "cluster of small stone-shelled crawler creatures with amber eyes, rocky nest, $EST"
  gera monstros anciao   1:1 "ancient mossy tree-spirit toad, bark skin, glowing fungus, swamp camp, $EST"
}

mapa(){
  gera mapa tabuleiro 1:1 "top-down fantasy strategy map of a MOBA battlefield, square diagonal layout, three stone roads crossing from bottom-left fortress to top-right fortress, dense dark forest between the roads, a glowing river cutting diagonally across the middle, small defensive towers along each road, two large fortress bases at opposite corners, a dragon pit on the lower river and a baron pit on the upper river, painted parchment war-map aesthetic, ornate border, $EST"
}

case "${1:-tudo}" in
  herois) herois ;;
  itens) itens ;;
  monstros) monstros ;;
  mapa) mapa ;;
  tudo) monstros; mapa; itens; herois ;;
esac
echo "— fim —"
