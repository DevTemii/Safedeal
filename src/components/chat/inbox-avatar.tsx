import Image from "next/image";
import { cn } from "@/lib/utils";

interface InboxAvatarProps {
  seed: string;
  initials: string;
  sizeClassName: string;
  textClassName?: string;
}

const avatarBackgrounds = [
  "from-[#f2d0c3] via-[#e2a272] to-[#cf7033]",
  "from-[#ffb16a] via-[#ef6331] to-[#cc371f]",
  "from-[#dbe7ef] via-[#7da7c8] to-[#426485]",
  "from-[#f2d6b2] via-[#d39d54] to-[#895b21]",
  "from-[#ded8f1] via-[#a0a7d9] to-[#6568a7]",
  "from-[#eee1d2] via-[#c9a88f] to-[#826858]",
];

const avatarImageBySeed: Record<string, string> = {
  "ada-designs": "/images/Safedeal ava 4.png",
  "blessing-cakes": "/images/Safedeal ava 2.png",
  "kemi-ui": "/images/Safedeal ava 4.png",
  "tobi-dev": "/images/Safedeal ava 3.png",
  "zainab-store": "/images/Safedeal ava 1.png",
};

function getAvatarBackground(seed: string) {
  const total = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return avatarBackgrounds[total % avatarBackgrounds.length];
}

export function InboxAvatar({
  seed,
  initials,
  sizeClassName,
  textClassName = "text-[14px] font-semibold",
}: InboxAvatarProps) {
  const imageSrc = avatarImageBySeed[seed];

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full",
        sizeClassName,
        imageSrc ? "bg-[#f5f5f5]" : cn("bg-gradient-to-br text-white", getAvatarBackground(seed))
      )}
    >
      {imageSrc ? (
        <Image
          alt=""
          className="object-cover"
          fill
          sizes="64px"
          src={imageSrc}
        />
      ) : (
        <div className={cn("flex size-full items-center justify-center text-white", textClassName)}>
          {initials}
        </div>
      )}
    </div>
  );
}
