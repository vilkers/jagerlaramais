import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HeroDetail from "../HeroDetail";
import { getHero, publishedHeroes } from "../data";

export function generateStaticParams() {
  return publishedHeroes.map((hero) => ({ slug: hero.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const hero = getHero(slug);
  return hero ? { title: `${hero.name} · Visual Guide`, description: hero.summary } : {};
}

export default async function HeroPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hero = getHero(slug);
  if (!hero || hero.progress === 0) notFound();

  return <HeroDetail hero={hero} />;
}
