import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { useNdk } from '../hooks/use-ndk';
import { useLogin } from '../hooks/use-login';
import { useGroupMetadata } from '../nip29/queries/use-group-metadata';
import { NDKEvent } from '@nostr-dev-kit/ndk';

// Mock the store
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
    createSubscription: jest.fn(),
    removeSubscription: jest.fn(),
  })),
}));

jest.mock('../nip29/store', () => ({
  useNip29Store: jest.fn((selector: (state: any) => any) => selector({
    groups: {
      'relay1-group1-metadata': {
        'group1': {
          metadata: {
            name: 'Test Group',
            picture: 'https://example.com/pic.jpg',
            about: 'Test Description',
            isPublic: true,
            isOpen: true,
          }
        }
      }
    },
    updateGroupMetadata: jest.fn(),
    getState: () => ({
      updateGroupMetadata: jest.fn()
    })
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

describe('useGroupMetadata hook', () => {
  it('should return undefined metadata when relay or groupId is missing', () => {
    const { metadata, isLoadingMetadata, metadataEvents } = useGroupMetadata(undefined, undefined);
    
    expect(metadata).toBeUndefined();
    expect(isLoadingMetadata).toBeFalsy();
    expect(metadataEvents).toEqual([]);
  });

  it('should return group metadata when relay and groupId are provided', () => {
    const { metadata, isLoadingMetadata } = useGroupMetadata('relay1', 'group1');
    
    expect(metadata).toEqual({
      name: 'Test Group',
      picture: 'https://example.com/pic.jpg',
      about: 'Test Description',
      isPublic: true,
      isOpen: true,
    });
    expect(isLoadingMetadata).toBeFalsy();
  });

  it('should create subscription with correct filters', () => {
    const mockCreateSubscription = jest.fn();
    jest.mock('../hooks', () => ({
      useSubscription: () => ({
        createSubscription: mockCreateSubscription,
        isLoading: false,
        events: [],
      }),
    }));

    useGroupMetadata('relay1', 'group1');

    expect(mockCreateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [{ kinds: [39000], '#d': ['group1'], limit: 1 }],
        relayUrls: ['relay1'],
      })
    );
  });

  it('should handle event processing correctly', () => {
    const mockUpdateGroupMetadata = jest.fn();
    const mockEvent = {
      dTag: 'group1',
      getMatchingTags: (tag: string) => {
        const tags: Record<string, string[][]> = {
          'name': [['name', 'Test Group']],
          'picture': [['picture', 'https://example.com/pic.jpg']],
          'about': [['about', 'Test Description']],
          'public': [['public', '1']],
          'open': [['open', '1']],
        };
        return tags[tag] || null;
      },
    } as unknown as NDKEvent;

    // Simulate event processing
    const onEvent = jest.fn();
    useGroupMetadata('relay1', 'group1');
    
    // Verify event processing
    if (onEvent) {
      onEvent(mockEvent);
      expect(mockUpdateGroupMetadata).toHaveBeenCalledWith(
        'relay1-group1-metadata',
        'group1',
        expect.objectContaining({
          name: 'Test Group',
          picture: 'https://example.com/pic.jpg',
          about: 'Test Description',
          isPublic: true,
          isOpen: true,
        })
      );
    }
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
