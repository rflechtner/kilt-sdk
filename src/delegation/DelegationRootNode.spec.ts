import { Text, Tuple } from '@polkadot/types'
import Bool from '@polkadot/types/primitive/Bool'
import { Blockchain, Crypto, Identity } from '../'
import { IDelegationRootNode } from './Delegation'
import { DelegationRootNode } from './DelegationRootNode'
import { TxStatus } from '../blockchain/TxStatus'

describe('Delegation', () => {
  const identityAlice = Identity.buildFromSeedString('Alice')

  const ctypeHash = Crypto.hashStr('testCtype')
  // @ts-ignore
  const blockchain = {
    api: {
      tx: {
        delegation: {
          createRoot: jest.fn((rootId, _ctypeHash) => {
            return Promise.resolve()
          }),
        },
      },
      query: {
        delegation: {
          root: jest.fn(rootId => {
            const tuple = new Tuple(
              // Root-Delegation: root-id -> (ctype-hash, account, revoked)
              [Text, Text, Bool],
              [ctypeHash, identityAlice.address, false]
            )
            return Promise.resolve(tuple)
          }),
          delegation: jest.fn(delegationId => {
            const tuple = new Tuple(
              // Root-Delegation: delegation-id -> (root-id, parent-id?, account, permissions, revoked)
              [Text, Text, Bool],
              [ctypeHash, identityAlice.address, false]
            )
            return Promise.resolve(tuple)
          }),
        },
      },
    },
    submitTx: jest.fn((identity, tx) => {
      return Promise.resolve(undefined)
    }),
    getNonce: jest.fn(),
  } as Blockchain

  const ROOT_IDENTIFIER = 'abc123'
  it('stores root delegation', async () => {
    const rootDelegation = new DelegationRootNode(
      ROOT_IDENTIFIER,
      ctypeHash,
      identityAlice.getPublicIdentity().address
    )
    rootDelegation.store(blockchain, identityAlice)
    const rootNode:
      | IDelegationRootNode
      | undefined = await DelegationRootNode.query(blockchain, ROOT_IDENTIFIER)
    if (rootNode) {
      expect(rootNode.id).toBe(ROOT_IDENTIFIER)
    }
  })

  it('query root delegation', async () => {
    // @ts-ignore
    const queriedDelegation: IDelegationRootNode = await DelegationRootNode.query(
      blockchain,
      ROOT_IDENTIFIER
    )
    expect(queriedDelegation.account).toBe(identityAlice.address)
    expect(queriedDelegation.cTypeHash).toBe(ctypeHash)
    expect(queriedDelegation.id).toBe(ROOT_IDENTIFIER)
  })

  it('root delegation verify', async () => {
    // @ts-ignore
    const myBlockchain = {
      api: {
        query: {
          delegation: {
            root: jest.fn(rootId => {
              if (rootId === 'success') {
                const tuple = new Tuple(
                  // Root-Delegation: root-id -> (ctype-hash, account, revoked)
                  [Text, Text, Bool],
                  ['myCtypeHash', 'myAccount', false]
                )
                return Promise.resolve(tuple)
              } else {
                const tuple = new Tuple(
                  // Root-Delegation: root-id -> (ctype-hash, account, revoked)
                  [Text, Text, Bool],
                  ['myCtypeHash', 'myAccount', true]
                )
                return Promise.resolve(tuple)
              }
            }),
          },
        },
      },
    } as Blockchain

    expect(
      await new DelegationRootNode(
        'success',
        'myCtypeHash',
        'myAccount'
      ).verify(myBlockchain)
    ).toBe(true)

    expect(
      await new DelegationRootNode(
        'failure',
        'myCtypeHash',
        'myAccount'
      ).verify(myBlockchain)
    ).toBe(false)
  })

  it('root delegation verify', async () => {
    let calledRootId: string = ''
    // @ts-ignore
    const myBlockchain = {
      api: {
        tx: {
          delegation: {
            revokeRoot: jest.fn(rootId => {
              calledRootId = rootId
            }),
          },
        },
      },
      submitTx: jest.fn((identity, tx) => {
        return Promise.resolve(new TxStatus(''))
      }),
    } as Blockchain

    const aDelegationRootNode = new DelegationRootNode(
      'myRootId',
      'myCtypeHash',
      'myAccount'
    )
    const revokeStatus = await aDelegationRootNode.revoke(
      myBlockchain,
      identityAlice
    )
    expect(calledRootId).toBe('myRootId')
    expect(revokeStatus).toBeDefined()
  })
})