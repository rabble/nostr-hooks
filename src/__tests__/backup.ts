import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useNdk } from '../hooks/use-ndk';
import { useLogin } from '../hooks/use-login';
import { useGroupNotes } from '../nip29/queries/use-group-notes';

// Mock useSubscription hook
jest.mock('../hooks/use-subscription', () => ({
  useSubscription: jest.fn((subId) => ({
    events: [],
    hasMore: false,
    isLoading: false,
    createSubscription: jest.fn((params) => {
      // Store the params for testing
      (useSubscription as jest.Mock).mockImplementation(() => ({
        events: [],
        hasMore: false,
        isLoading: false,
        createSubscription: jest.fn(),
        lastParams: params
      }));
    }),
    removeSubscription: jest.fn(),
    loadMore: jest.fn(),
  }))
}));

// Simple store mock
jest.mock('../store', () => ({
  useStore: jest.fn((selector) => selector({
    ndk: undefined,
    subscriptions: {},
  })),
}));

// Simple Nip29 store mock
jest.mock('../nip29/store', () => ({
  useNip29Store: jest.fn((selector) => selector({
    groups: {},
    addGroupNote: jest.fn(),
  })),
}));

describe('useNdk hook', () => {
  it('should return ndk related functions and state', () => {
    const ndkHook = useNdk();
    
    expect(ndkHook).toHaveProperty('ndk');
    expect(ndkHook).toHaveProperty('initNdk');
    expect(ndkHook).toHaveProperty('setSigner');
    expect(ndkHook).toHaveProperty('constructorParams');
  });

  it('should return functions of correct type', () => {
    const { initNdk, setSigner } = useNdk();
    
    expect(typeof initNdk).toBe('function');
    expect(typeof setSigner).toBe('function');
  });

  it('should initially return undefined for ndk and constructorParams', () => {
    const { ndk, constructorParams } = useNdk();
    
    expect(ndk).toBeUndefined();
    expect(constructorParams).toBeUndefined();
  });
});

describe('useGroupNotes hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not create subscription without relay and groupId', () => {
    const { result } = renderHook(() => useGroupNotes(undefined, undefined));
    expect(result.current.notes).toBeUndefined();
  });

  it('should create subscription with correct filters', () => {
    const relay = 'wss://test.relay';
    const groupId = 'group123';
    
    const { result } = renderHook(() => useGroupNotes(relay, groupId));
    const hook = require('../hooks/use-subscription');
    const lastCall = hook.useSubscription.mock.results[hook.useSubscription.mock.results.length - 1].value;

    expect(lastCall.lastParams).toEqual(
      expect.objectContaining({
        filters: [expect.objectContaining({ 
          kinds: [1], 
          '#h': [groupId],
          limit: 10 
        })],
        relayUrls: [relay],
      })
    );
  });

  it('should handle optional filter parameters', () => {
    const relay = 'wss://test.relay';
    const groupId = 'group123';
    const filter = {
      byPubkey: { pubkey: 'testPubkey', waitForPubkey: true as const },
      since: 1000,
      until: 2000,
      limit: 20,
    };

    const { result } = renderHook(() => useGroupNotes(relay, groupId, filter));
    const hook = require('../hooks/use-subscription');
    const lastCall = hook.useSubscription.mock.results[hook.useSubscription.mock.results.length - 1].value;

    expect(lastCall.lastParams).toEqual(
      expect.objectContaining({
        filters: [expect.objectContaining({
          kinds: [1],
          '#h': [groupId],
          authors: ['testPubkey'],
          since: 1000,
          until: 2000,
          limit: 20,
        })],
        relayUrls: [relay],
      })
    );
  });
});

describe('useLogin hook', () => {
  it('should return login related functions and state', () => {
    const loginHook = useLogin();
    
    expect(loginHook).toHaveProperty('loginData');
    expect(loginHook).toHaveProperty('loginFromLocalStorage');
    expect(loginHook).toHaveProperty('loginWithExtension');
    expect(loginHook).toHaveProperty('loginWithPrivateKey');
    expect(loginHook).toHaveProperty('loginWithRemoteSigner');
    expect(loginHook).toHaveProperty('logout');
  });

  it('should have correct initial login state', () => {
    const { loginData } = useLogin();
    
    expect(loginData).toEqual({
      privateKey: undefined,
      loginMethod: undefined,
      nip46Address: undefined
    });
  });

  it('should return functions of correct type', () => {
    const {
      loginFromLocalStorage,
      loginWithExtension,
      loginWithPrivateKey,
      loginWithRemoteSigner,
      logout
    } = useLogin();
    
    expect(typeof loginFromLocalStorage).toBe('function');
    expect(typeof loginWithExtension).toBe('function');
    expect(typeof loginWithPrivateKey).toBe('function');
    expect(typeof loginWithRemoteSigner).toBe('function');
    expect(typeof logout).toBe('function');
  });
});
