export type StageStatus = "APROVADO" | "CRAFT PENDENTE" | "REFAZER" | "PENDENTE";

export type HeroStage = {
  id: string;
  label: string;
  navLabel: string;
  status: StageStatus;
  image?: string;
  alt?: string;
  note: string;
  fit?: "cover" | "contain";
};

export type Hero = {
  id: string;
  slug: string;
  name: string;
  title: string;
  role: string;
  status: string;
  currentStage: string;
  progress: number;
  color: string;
  thumbnail: string;
  summary: string;
  stages: HeroStage[];
};

export const heroes: Hero[] = [
  {
    id: "01",
    slug: "dona-chinela",
    name: "DONA CHINELA",
    title: "A ÚLTIMA PALAVRA",
    role: "TOPO · TANQUE",
    status: "PERSONAGEM-MATRIZ",
    currentStage: "VERSÃO 3D PARA REFAZER",
    progress: 4,
    color: "#c8ff35",
    thumbnail: "/images/dona-chinela-v1.jpeg",
    summary: "Uma avó baixa, fofinha e implacável. Resolve conflitos com O Corretivo, um tamanco-bazuca reconstruído a partir dos restos do Conjunto Fortaleza.",
    stages: [
      { id: "01", label: "CONCEPT", navLabel: "CONCEPT", status: "APROVADO", image: "/images/dona-chinela-v1.jpeg", alt: "Concept da Dona Chinela em fundo bege", note: "Personagem inteiro em fundo bege. Esta imagem fixa identidade, silhueta, proporções, materiais, luz e a régua de craft 3D do elenco.", fit: "cover" },
      { id: "02", label: "SHEET", navLabel: "SHEET", status: "APROVADO", image: "/images/heroes/dona-chinela/03-sheet.webp", alt: "Sheet da Dona Chinela com views e expressões", note: "Views coerentes do personagem, expressões autorais e leitura do objeto-assinatura reunidas em uma prancha de produção.", fit: "contain" },
      { id: "03", label: "VERSÃO 3D", navLabel: "VERSÃO 3D", status: "REFAZER", image: "/images/heroes/dona-chinela/04-miniature.webp", alt: "Estudo anterior da versão 3D da Dona Chinela", note: "Asset anterior mantido apenas como registro. O novo formato terá exatamente três views na base hexagonal: uma colorida e duas em clay.", fit: "contain" },
      { id: "04", label: "CARTA", navLabel: "CARTA", status: "APROVADO", image: "/images/heroes/dona-chinela/05-key-art.webp", alt: "Carta ambientada da Dona Chinela", note: "Imagem contextualizada no Conjunto Fortaleza, com acting, personalidade e território próprios. É a fonte visual do futuro vídeo.", fit: "cover" },
      { id: "05", label: "VÍDEO", navLabel: "VÍDEO", status: "PENDENTE", note: "O teste anterior foi descartado. A nova versão deverá animar esta carta sem redesenhar rosto, corpo, roupa, arma ou ambiente." },
    ],
  },
  {
    id: "02",
    slug: "pombo",
    name: "P.O.M.B.O.",
    title: "PRAGA ORBITAL",
    role: "SELVA · ASSASSINO",
    status: "DESIGN APROVADO",
    currentStage: "CRAFT 3D PENDENTE",
    progress: 3,
    color: "#23d7a0",
    thumbnail: "/images/heroes/pombo/01-concept.webp",
    summary: "Pombo ciborgue, nervoso e territorial. Um assassino urbano montado com próteses assimétricas, sucata de rua e um roteador que trata sinal como alimento.",
    stages: [
      { id: "01", label: "CONCEPT", navLabel: "CONCEPT", status: "CRAFT PENDENTE", image: "/images/heroes/pombo/01-concept.webp", alt: "Concept do P.O.M.B.O. em fundo bege", note: "O design-base está aprovado: peito estufado, moicano, olho óptico, crucifixo, próteses e mochila de roteador. O acabamento ainda precisa alcançar o volume, a luz e os materiais da Dona Chinela.", fit: "contain" },
      { id: "02", label: "SHEET", navLabel: "SHEET", status: "CRAFT PENDENTE", image: "/images/heroes/pombo/03-sheet.webp", alt: "Sheet do P.O.M.B.O. com views e expressões", note: "A estrutura de views e expressões está resolvida, mas a prancha deriva de um master visual ainda plano. Deve ser refeita após o concept fechar na régua 3D correta.", fit: "contain" },
      { id: "03", label: "VERSÃO 3D", navLabel: "VERSÃO 3D", status: "REFAZER", image: "/images/heroes/pombo/04-miniature.webp", alt: "Estudo anterior da versão 3D do P.O.M.B.O.", note: "O board atual tem quatro views e herda o craft inconsistente. Refazer com exatamente uma versão colorida e duas clay, todas na base hexagonal.", fit: "contain" },
      { id: "04", label: "CARTA", navLabel: "CARTA", status: "PENDENTE", note: "Falta criar a imagem contextualizada com território, personalidade e acting próprios, preservando integralmente o concept aprovado." },
      { id: "05", label: "VÍDEO", navLabel: "VÍDEO", status: "PENDENTE", note: "Será uma animação curta derivada diretamente da carta aprovada. Nenhuma geração antes de fechar o pipeline visual." },
    ],
  },
  {
    id: "03",
    slug: "catarino",
    name: "CATARINO",
    title: "O MENINO CONGESTIONADO",
    role: "MEIO · MAGO",
    status: "DESIGN APROVADO",
    currentStage: "CRAFT 3D PENDENTE",
    progress: 3,
    color: "#8c6cff",
    thumbnail: "/images/heroes/catarino/01-concept.webp",
    summary: "Criança congestionada e inventora de quintal. Coleta, pressuriza e dispara catarro por um sistema improvisado de mochila medicinal e flauta-canhão.",
    stages: [
      { id: "01", label: "CONCEPT", navLabel: "CONCEPT", status: "CRAFT PENDENTE", image: "/images/heroes/catarino/01-concept.webp", alt: "Concept do Catarino em fundo bege", note: "O design-base e o mecanismo estão encaminhados, mas pele, tecido, cabelo, equipamento e luz ainda não têm a profundidade 3D da Dona Chinela.", fit: "contain" },
      { id: "02", label: "SHEET", navLabel: "SHEET", status: "CRAFT PENDENTE", image: "/images/heroes/catarino/03-sheet.webp", alt: "Sheet do Catarino com views e expressões", note: "A prancha reúne views, expressões e equipamento, porém propaga o acabamento mais plano do concept atual. Deve ser refeita depois do novo master visual.", fit: "contain" },
      { id: "03", label: "VERSÃO 3D", navLabel: "VERSÃO 3D", status: "REFAZER", image: "/images/heroes/catarino/04-miniature.webp", alt: "Estudo anterior da versão 3D do Catarino", note: "O board atual usa quatro views. Refazer com exatamente uma versão colorida e duas clay, todas na base hexagonal e com tubos consolidados.", fit: "contain" },
      { id: "04", label: "CARTA", navLabel: "CARTA", status: "PENDENTE", note: "Falta criar a imagem contextualizada com personalidade, território e acting próprios, sem alterar rosto, roupa ou mecanismo." },
      { id: "05", label: "VÍDEO", navLabel: "VÍDEO", status: "PENDENTE", note: "Será uma animação curta derivada diretamente da carta aprovada. Nenhuma geração antes de fechar o pipeline visual." },
    ],
  },
];

export const publishedHeroes = heroes;

export function getHero(slug: string) {
  return heroes.find((hero) => hero.slug === slug);
}
