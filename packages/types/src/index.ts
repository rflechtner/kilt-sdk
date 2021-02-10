/**
 * @packageDocumentation
 * @ignore
 */

export * from './AttestedClaim'
export * from './Attestation'
export * from './CType'
export * from './CTypeMetadata'
export * from './Claim'
export * from './Delegation'
export * from './PublicIdentity'
export * from './Quote'
export * from './RequestForAttestation'
export * from './Terms'

import { Kilt } from './chainTypes/definitions'

export const apiConstructorTypes = Kilt.types

import './chainTypes/augment-api'
