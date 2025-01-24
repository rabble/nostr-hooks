import { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';
import { useEffect } from 'react';

import { useSubscription } from '../../../hooks';
import { useNip29Store } from '../../../nip29/store';
import { Nip29GroupNote } from '../../types';

const addGroupNote = useNip29Store.getState().addGroupNote;

export const useGroupNotes = (
  relay: string | undefined,
  groupId: string | undefined,
  filter?: {
    byPubkey?: {
      pubkey: string | undefined;
      waitForPubkey: true;
    };
    byId?: {
      id: string | undefined;
      waitForId: true;
    };
    byParentId?: {
      parentId: string | undefined;
      waitForParentId: true;
    };
    since?: number | undefined;
    until?: number | undefined;
    limit?: number | undefined;
  }
) => {
  const subId =
    relay && groupId ? `${relay}-${groupId}-chatNotes-${JSON.stringify(filter)}` : undefined;

  const chatNotes = useNip29Store((state) =>
    subId && groupId ? state.groups[subId]?.[groupId]?.chatNotes : undefined
  );

  const { events, hasMore, isLoading, createSubscription, loadMore } = useSubscription(subId);

  useEffect(() => {
    if (!relay || !groupId || !subId) return;
    if (filter?.byPubkey?.waitForPubkey && !filter.byPubkey.pubkey) return;
    if (filter?.byId?.waitForId && !filter.byId.id) return;
    if (filter?.byParentId?.waitForParentId && !filter.byParentId.parentId) return;

    let f: NDKFilter = { kinds: [1], limit: filter?.limit || 10 };
    if (groupId) f['#h'] = [groupId];
    if (filter?.byPubkey?.pubkey) f.authors = [filter.byPubkey.pubkey];
    if (filter?.byId?.id) f.ids = [filter.byId.id];
    if (filter?.byParentId?.parentId) f['#e'] = [filter.byParentId.parentId];
    if (filter?.since) f.since = filter.since;
    if (filter?.until) f.until = filter.until;

    const filters = [f];
    const relayUrls = [relay];

    const onEvent = (event: NDKEvent) => {
      const chatNote: Nip29GroupNote = {
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        timestamp: event.created_at || 0,
        parentId: event.getMatchingTags('e')?.[0]?.[1] || undefined,
      };

      addGroupNote(subId, groupId, chatNote);
    };

    createSubscription({ filters, relayUrls, onEvent });
  }, [
    subId,
    relay,
    groupId,
    filter?.byPubkey?.pubkey,
    filter?.byPubkey?.waitForPubkey,
    filter?.byId?.id,
    filter?.byId?.waitForId,
    filter?.byParentId?.parentId,
    filter?.byParentId?.waitForParentId,
    filter?.since,
    filter?.until,
    createSubscription,
  ]);

  return {
    chatNotes,
    isLoadingChatNotes: isLoading,
    hasMoreChatNotes: hasMore,
    loadMoreChatNotes: loadMore,
    chatNotesEvents: events,
  };
}; 