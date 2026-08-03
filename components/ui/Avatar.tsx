import { cn } from '@/lib/cn';
import { initial } from '@/lib/format';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  name: string;
  size?: AvatarSize;
  className?: string;
}

/** Member avatar: initial on a gold surface. No photos.
 *  Decorative — the member's name is always spelled out next to it. */
export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn('sd-avatar', size !== 'md' && `sd-avatar--${size}`, className)}
      aria-hidden="true"
    >
      {initial(name)}
    </div>
  );
}

export interface CategoryIconProps {
  /** Emoji. The app doesn't use an icon library. */
  icon: string;
  background?: string;
  className?: string;
}

/** Category emoji holder: same footprint as the avatar, rounded corners. */
export function CategoryIcon({ icon, background, className }: CategoryIconProps) {
  return (
    <div
      className={cn('sd-avatar', 'sd-avatar--icon', className)}
      style={background ? { background } : undefined}
      aria-hidden="true"
    >
      {icon}
    </div>
  );
}
