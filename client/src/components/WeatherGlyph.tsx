/** Tidal Tactile icon primitive: familiar weather states expressed as clean blue-green instrument glyphs. */
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, MoonStar, Sun } from "lucide-react";

type WeatherGlyphProps = { code: number; isDay?: boolean; size?: number; className?: string };

export default function WeatherGlyph({ code, isDay = true, size = 28, className = "" }: WeatherGlyphProps) {
  const props = { size, strokeWidth: 1.65, className };
  if (code === 0) return isDay ? <Sun {...props} /> : <MoonStar {...props} />;
  if ([1, 2].includes(code)) return <CloudSun {...props} />;
  if (code === 3) return <Cloud {...props} />;
  if ([45, 48].includes(code)) return <CloudFog {...props} />;
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return <CloudRain {...props} />;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow {...props} />;
  if ([95, 96, 99].includes(code)) return <CloudLightning {...props} />;
  return <Cloud {...props} />;
}

