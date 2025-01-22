
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { useNdk } from '../hooks/use-ndk';
import { useLogin } from '../hooks/use-login';
import { useGroupNotes } from '../nip29/queries/use-group-notes';
const mockCreateSubscription = jest.fn();
const mockAddGroupNote = jest.fn();

jest.mock('../store', () => ({
  useStore: jest.fn((selector: (state: any) => any) => selector({
    // Mock initial state
    ndk: undefined,
    initNdk: jest.fn(),
    setSigner: jest.fn(),
    constructorParams: undefined,
    loginData: {
      privateKey: undefined,
      loginMethod: undefined,
      nip46Address: undefined
    },
    loginFromLocalStorage: jest.fn(),
    loginWithExtension: jest.fn(),
    loginWithPrivateKey: jest.fn(),
    loginWithRemoteSigner: jest.fn(),
    logout: jest.fn(),
    createSubscription: mockCreateSubscription,
    removeSubscription: jest.fn(),
  })),
}));

jest.mock('../nip29/store', () => ({
  useNip29Store: jest.fn((selector: (state: any) => any) => selector({
    groups: {},
    addGroupNote: mockAddGroupNote,
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
    mockCreateSubscription.mockClear();
  });

  it('should not create subscription without relay and groupId', () => {
    const { notes } = useGroupNotes(undefined, undefined);
    expect(notes).toBeUndefined();
    expect(mockCreateSubscription).not.toHaveBeenCalled();
  });

  it('should create subscription with correct filters', () => {
    const relay = 'wss://test.relay';
    const groupId = 'group123';
    
    useGroupNotes(relay, groupId);

    expect(mockCreateSubscription).toHaveBeenCalledWith(
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

    useGroupNotes(relay, groupId, filter);

    expect(mockCreateSubscription).toHaveBeenCalledWith(
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
