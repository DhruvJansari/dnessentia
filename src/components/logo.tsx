import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  inverted?: boolean;
  preload?: boolean;
  className?: string;
  onClick?: () => void;
};

export function Logo({ inverted = false, preload = false, className = "", onClick }: LogoProps) {
  return (
    <Link href="/" aria-label="DN Essentia home" onClick={onClick} className={`inline-block ${className}`}>
      <Image
        src="/images/brand/logo.png"
        alt="DN Essentia"
        width={1395}
        height={935}
        sizes="120px"
        preload={preload}
        className={`h-full w-auto ${inverted ? "invert" : ""}`}
      />
    </Link>
  );
}
