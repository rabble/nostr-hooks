import { NDKEvent, NDKRelaySet } from '@nostr-dev-kit/ndk';

import { useStore } from '../../../../store';
import { Nip29GroupNote } from '../../../types';

export const sendGroupNote = ({
  relay,
  groupId,
  chatNote,
  onSuccess,
  onError,
}: {
  relay: string;
  groupId: string;
  note: Pick<Nip29GroupNote, 'content' | 'parentId'>;
  onSuccess?: () => void;
  onError?: () => void;
}) => {
  const ndk = useStore.getState().ndk;
  if (!ndk) return;

  if (!groupId) return;

  const event = new NDKEvent(ndk);
  event.kind = 1;
  event.content = note.content;
  event.tags = [['h', groupId]];
  note.parentId && event.tags.push(['e', note.parentId]);

  event.publish(NDKRelaySet.fromRelayUrls([relay], ndk)).then(
    (r) => {
      if (r.size > 0) {
        onSuccess?.();
      } else {
        onError?.();
      }
    },
    () => {
      onError?.();
    }
  );
}; 
