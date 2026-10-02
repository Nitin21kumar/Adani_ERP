import { cn } from "@/utils/cn";
import adaniPowerLogo from "@/assets/adani-power-logo.jpg";

const BRAND_NAME = "Adani Power";

interface CompanyLogoProps {
  /** Pixel size of the square icon/logo box. */
  size?: number;
  /** Show the company name text next to the mark. */
  showName?: boolean;
  className?: string;
  nameClassName?: string;
}

/**
 * Renders the Adani Power logo and name. Branding is fixed: any logo or
 * company name uploaded in Settings > Company Details is intentionally not
 * used here, so every screen shows the same Adani Power identity.
 *
 * The logo is a JPG on a white background, so it's always placed on a
 * white tile to stay clean in dark mode.
 */
export default function CompanyLogo({ size = 36, showName = true, className, nameClassName }: CompanyLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm"
        style={{ height: size, width: size }}
      >
        <img src={adaniPowerLogo} alt={BRAND_NAME} className="h-full w-full object-contain" />
      </div>
      {showName && <span className={cn("font-semibold tracking-tight text-brand-gradient", nameClassName)}>{BRAND_NAME}</span>}
    </div>
  );
}
