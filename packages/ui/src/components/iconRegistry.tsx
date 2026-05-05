import type { ReactElement } from 'react';
import {
  IconHeritage,
  IconArts,
  IconCreative,
  IconBook,
  IconFilm,
  IconExchange,
  IconSubsidy,
  IconApply,
  IconStatus,
  IconVenue,
  IconStreetArtist,
  IconMoney,
  IconChat,
} from './icons';

/** 後台選 icon 用字串名 (e.g. "apply") → 前台 mapping 到對應 SVG 元件。 */
export const ICON_REGISTRY: Record<string, () => ReactElement> = {
  // 業務專區
  heritage: IconHeritage,
  arts: IconArts,
  creative: IconCreative,
  book: IconBook,
  film: IconFilm,
  exchange: IconExchange,
  subsidy: IconSubsidy,
  // 快速服務
  apply: IconApply,
  status: IconStatus,
  venue: IconVenue,
  'street-artist': IconStreetArtist,
  money: IconMoney,
  chat: IconChat,
};

export function renderIcon(name: string | undefined): ReactElement | null {
  if (!name) return null;
  const Cmp = ICON_REGISTRY[name];
  return Cmp ? <Cmp /> : null;
}
