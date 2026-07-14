import { InvitationWithContext } from '../repositories/workspace-invitation.repository';

export type PublicInvitation = Omit<InvitationWithContext, 'tokenHash'>;

export function toPublicInvitation(invitation: InvitationWithContext): PublicInvitation {
  const { tokenHash: _tokenHash, ...publicInvitation } = invitation;

  return publicInvitation;
}
