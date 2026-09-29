import type { HostId } from '../../content/buildings';
import { Icon } from '../art/Icon';
import { Speech } from './Speech';

export function NotYet({ who, text }: { who: HostId; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-6">
      <Icon name="zzz" size={72} className="opacity-70 animate-float" />
      <Speech who={who}>{text}</Speech>
    </div>
  );
}
