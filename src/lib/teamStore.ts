
'use client';

import { db as clientDb } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  arrayUnion,
  arrayRemove,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import type { Team, TeamMember, TeamMemberRole, User } from '@/types';

export const TEAMS_COLLECTION = 'teams';

export const createTeam = async (name: string, owner: User): Promise<Team> => {
  if (!clientDb || !owner.uid) throw new Error("Authentication/DB error.");

  const ownerMember: TeamMember = {
    uid: owner.uid,
    email: owner.email || 'unknown',
    displayName: owner.displayName || 'Owner',
    photoURL: owner.photoURL || null,
    role: 'owner',
  };

  const teamData = {
    name,
    ownerId: owner.uid,
    members: [ownerMember],
    'members.uid': [owner.uid], // Denormalized array for querying
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(clientDb, TEAMS_COLLECTION), teamData);
  
  return {
    id: docRef.id,
    name,
    ownerId: owner.uid,
    members: [ownerMember],
    createdAt: Date.now(),
  };
};

export const getTeamsForUser = async (userId: string): Promise<Team[]> => {
  if (!clientDb || !userId) return [];
  
  const teamsRef = collection(clientDb, TEAMS_COLLECTION);
  const q = query(teamsRef, where('members.uid', 'array-contains', userId));

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp).toMillis(),
    } as Team;
  });
};


export const getTeamById = async (teamId: string): Promise<Team | null> => {
    if (!clientDb) return null;
    const teamRef = doc(clientDb, TEAMS_COLLECTION, teamId);
    const teamSnap = await getDoc(teamRef);
    if (teamSnap.exists()) {
        const data = teamSnap.data();
        return {
            id: teamSnap.id,
            ...data,
            createdAt: (data.createdAt as Timestamp).toMillis(),
        } as Team;
    }
    return null;
};


export const inviteMemberToTeam = async (teamId: string, currentUserId: string, invitedUser: User & { id: string }): Promise<void> => {
  if (!clientDb) throw new Error("DB error.");
  const teamRef = doc(clientDb, TEAMS_COLLECTION, teamId);
  const teamSnap = await getDoc(teamRef);

  if (!teamSnap.exists()) throw new Error("Team not found.");
  const teamData = teamSnap.data() as Team;
  
  if (teamData.ownerId !== currentUserId) throw new Error("Only the team owner can invite members.");
  if (teamData.members.some(m => m.uid === invitedUser.uid)) throw new Error("This user is already a member of the team.");

  const newMember: TeamMember = {
    uid: invitedUser.uid,
    email: invitedUser.email || 'unknown',
    displayName: invitedUser.displayName || 'New Member',
    photoURL: invitedUser.photoURL || null,
    role: 'viewer', // Default role
  };
  await updateDoc(teamRef, {
    members: arrayUnion(newMember),
    'members.uid': arrayUnion(invitedUser.uid), // Update the queryable array
  });
};

export const updateTeamMemberRole = async (teamId: string, currentUserId: string, memberUid: string, newRole: TeamMemberRole): Promise<void> => {
    if (!clientDb) throw new Error("DB error.");
    const teamRef = doc(clientDb, TEAMS_COLLECTION, teamId);
    const teamSnap = await getDoc(teamRef);

    if (!teamSnap.exists()) throw new Error("Team not found.");
    const teamData = teamSnap.data() as Team;

    if (teamData.ownerId !== currentUserId) throw new Error("Only the team owner can change roles.");
    if (memberUid === currentUserId) throw new Error("Cannot change your own role.");

    const memberIndex = teamData.members.findIndex(m => m.uid === memberUid);
    if (memberIndex === -1) throw new Error("Member not found in team.");

    const updatedMembers = [...teamData.members];
    updatedMembers[memberIndex].role = newRole;

    await updateDoc(teamRef, { members: updatedMembers });
};

export const removeMemberFromTeam = async (teamId: string, currentUserId: string, memberToRemove: TeamMember): Promise<void> => {
    if (!clientDb) throw new Error("DB error.");
    const teamRef = doc(clientDb, TEAMS_COLLECTION, teamId);
    const teamSnap = await getDoc(teamRef);

    if (!teamSnap.exists()) throw new Error("Team not found.");
    const teamData = teamSnap.data() as Team;

    if (teamData.ownerId !== currentUserId) throw new Error("Only the team owner can remove members.");
    if (memberToRemove.uid === currentUserId) throw new Error("Cannot remove yourself as the owner.");
    
    // Find the full member object to remove, as arrayRemove requires the exact object.
    const fullMemberToRemove = teamData.members.find(m => m.uid === memberToRemove.uid);
    if (!fullMemberToRemove) throw new Error("Member object not found for removal.");

    await updateDoc(teamRef, {
        members: arrayRemove(fullMemberToRemove),
        'members.uid': arrayRemove(memberToRemove.uid) // Also remove from query array
    });
};

export const leaveTeam = async (teamId: string, userId: string): Promise<void> => {
    if (!clientDb) throw new Error("DB error.");
    const teamRef = doc(clientDb, TEAMS_COLLECTION, teamId);
    const teamSnap = await getDoc(teamRef);

    if (!teamSnap.exists()) throw new Error("Team not found.");
    const teamData = teamSnap.data() as Team;
    
    if (teamData.ownerId === userId) throw new Error("Owners cannot leave a team. You must delete it or transfer ownership.");

    const memberToRemove = teamData.members.find(m => m.uid === userId);
    if (!memberToRemove) throw new Error("You are not a member of this team.");

    await updateDoc(teamRef, {
        members: arrayRemove(memberToRemove),
        'members.uid': arrayRemove(userId)
    });
};


export const deleteTeam = async (teamId: string, userId: string): Promise<void> => {
    if (!clientDb) throw new Error("DB error.");
    const teamRef = doc(clientDb, TEAMS_COLLECTION, teamId);
    const teamSnap = await getDoc(teamRef);

    if (!teamSnap.exists()) throw new Error("Team not found.");
    if (teamSnap.data().ownerId !== userId) throw new Error("Only the team owner can delete the team.");

    // TODO: Need a function to delete all episodes for a TEAM
    // await deleteAllEpisodesForTeam(teamId);

    await deleteDoc(teamRef);
};
