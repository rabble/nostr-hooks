import { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';
import { useEffect } from 'react';

import { useSubscription } from '../../../hooks';
import { useNip29Store } from '../../../nip29/store';
import { Nip29GroupNote } from '../../types';

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
  const subId = relay && groupId
    ? `${relay}-${groupId}-notes${filter ? `-${JSON.stringify(filter)}` : ''}`
    : undefined;

  const notes = useNip29Store((state) =>
    subId && groupId ? state.groups[subId]?.[groupId]?.notes : undefined
  );

  const { events, hasMore, isLoading, createSubscription, loadMore } = useSubscription(subId);

  useEffect(() => {
    if (!relay || !groupId) return;

    const filters = [{
      kinds: [1],
      '#h': [groupId],
      authors: filter?.byPubkey?.pubkey ? [filter.byPubkey.pubkey] : undefined,
      ids: filter?.byId?.id ? [filter.byId.id] : undefined,
      '#e': filter?.byParentId?.parentId ? [filter.byParentId.parentId] : undefined,
      since: filter?.since,
      until: filter?.until,
      limit: filter?.limit || 10
    }];

    createSubscription(filters);
  }, [
    subId,
    relay,
    groupId,
    filter?.byPubkey?.pubkey,
    filter?.byId?.id,
    filter?.byParentId?.parentId,
    filter?.since,
    filter?.until,
    createSubscription,
  ]);

  return {
    notes,
    isLoadingNotes: isLoading,
    hasMoreNotes: hasMore,
    loadMoreNotes: loadMore,
    notesEvents: events,
  };
}; 
