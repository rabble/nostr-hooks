import { NDKEvent, NDKRelaySet } from '@nostr-dev-kit/ndk';

import { useStore } from '../../../../store';
import { Nip29GroupChatNote } from '../../../types';

export const sendGroupChatNote = ({
  relay,
  groupId,
  chatNote,
  onSuccess,
  onError,
}: {
  relay: string;
  groupId: string;
  chatNote: Pick<Nip29GroupChatNote, 'content' | 'parentId'>;
  onSuccess?: () => void;
  onError?: () => void;
}) => {
  const ndk = useStore.getState().ndk;
  if (!ndk) return;

  if (!groupId) return;

  const event = new NDKEvent(ndk);
  event.kind = 1;
  event.content = chatNote.content;
  event.tags = [['h', groupId]];
  chatNote.parentId && event.tags.push(['e', chatNote.parentId]);

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