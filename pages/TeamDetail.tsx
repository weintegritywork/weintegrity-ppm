import React, { useContext, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { SettingsContext } from '../context/SettingsContext';
import Card from '../components/Card';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { Story, StoryState, Role, Team } from '../types';
import PageHeader from '../components/PageHeader';

const TeamDetail: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const dataContext = useContext(DataContext);
  const authContext = useContext(AuthContext);
  const toastContext = useContext(ToastContext);
  const settingsContext = useContext(SettingsContext);
  const navigate = useNavigate();

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRemoveMemberModalOpen, setIsRemoveMemberModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);


  if (!dataContext || !authContext || !toastContext || !settingsContext) return <div>Loading...</div>;

  const { teams, users, stories, projects, addMembersToTeam, updateTeam, deleteTeam } = dataContext;
  const { currentUser } = authContext;
  const { settings } = settingsContext;
  
  const team = teams.find(t => t.id === teamId);
  
  if (!team) return <div>Team not found.</div>;

  const lead = users.find(u => u.id === team.leadId);
  const members = users.filter(u => team.memberIds.includes(u.id));
  const project = projects.find(p => p.id === team.projectId);
  const teamStories = stories.filter(s => s.assignedTeamId === team.id);

  const availableUsers = useMemo(() => {
    return users.filter(u => !u.teamId || u.teamId === team.id);
  }, [users, team.id]);

  const handleMemberSelect = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };
  
  const handleAddMembers = async () => {
    if (selectedUserIds.length === 0) {
      toastContext.addToast('Please select at least one member to add.', 'error');
      return;
    }
    try {
      await addMembersToTeam(team.id, selectedUserIds);
      toastContext.addToast('Members added successfully!', 'success');
      setIsAddMemberModalOpen(false);
      setSelectedUserIds([]);
    } catch (error) {
      toastContext.addToast('Failed to add members. Please try again.', 'error');
    }
  };

  const handleEditClick = () => {
    setEditingTeam({ ...team });
    setIsEditModalOpen(true);
  };

  const handleTeamFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (editingTeam) {
      setEditingTeam({ ...editingTeam, [e.target.name]: e.target.value });
    }
  };

  const handleSaveChanges = async () => {
    if (editingTeam) {
      try {
        await updateTeam(team.id, editingTeam);
        toastContext.addToast('Team details updated!', 'success');
        setIsEditModalOpen(false);
      } catch (error) {
        toastContext.addToast('Failed to update team. Please try again.', 'error');
      }
    }
  };

  const handleDeleteTeam = async () => {
    try {
      await deleteTeam(team.id);
      toastContext.addToast('Team has been permanently deleted.', 'success');
      navigate('/teams');
    } catch (error) {
      toastContext.addToast('Failed to delete team. Please try again.', 'error');
    }
  };

  const handleRemoveMemberClick = (userId: string) => {
    setMemberToRemove(userId);
    setIsRemoveMemberModalOpen(true);
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    
    // Prevent removing the team lead
    if (memberToRemove === team.leadId) {
      toastContext.addToast('Cannot remove the team lead. Please assign a new lead first.', 'error');
      setIsRemoveMemberModalOpen(false);
      setMemberToRemove(null);
      return;
    }

    try {
      const updatedMemberIds = team.memberIds.filter(id => id !== memberToRemove);
      await updateTeam(team.id, { memberIds: updatedMemberIds });
      toastContext.addToast('Member removed successfully!', 'success');
      setIsRemoveMemberModalOpen(false);
      setMemberToRemove(null);
    } catch (error) {
      toastContext.addToast('Failed to remove member. Please try again.', 'error');
    }
  };

  const canEditTeam = currentUser && settings?.accessControl?.[currentUser.role]?.canEditTeam === true;
  const canDeleteTeam = currentUser && settings?.accessControl?.[currentUser.role]?.canDeleteTeam === true;

  return (
    <>
      <PageHeader
        title={team.name}
        showBackButton
        actions={
          canEditTeam && (
            <button
              onClick={handleEditClick}
              className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
            >
              Edit
            </button>
          )
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-500">Team Lead:</span>
                <p className="text-gray-800">{lead ? (
                    currentUser?.role === Role.Admin || currentUser?.role === Role.HR ? (
                        <Link to={`/profile/${lead.id}`} className="text-blue-600 hover:underline">{`${lead.firstName} ${lead.lastName}`}</Link>
                    ) : (
                        <span className="font-medium text-gray-800">{`${lead.firstName} ${lead.lastName}`}</span>
                    )
                ) : 'N/A'}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Current Project:</span>
                <p className="text-gray-800">{project ? <Link to={`/projects/${project.id}`} className="text-blue-600 hover:underline">{project.name}</Link> : 'N/A'}</p>
              </div>
            </div>
          </Card>
          <Card title="Team Stories">
              {teamStories.length > 0 ? (
                   <ul className="space-y-3 max-h-96 overflow-y-auto">
                   {teamStories.map((story: Story) => (
                     <li key={story.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                       <Link to={`/stories/${story.id}`} className="flex justify-between items-center">
                         <div>
                           <span className="font-semibold text-blue-600">{story.number}</span>
                           <p className="text-sm text-gray-700">{story.shortDescription}</p>
                         </div>
                         <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                           story.state === StoryState.Done ? 'bg-green-100 text-green-800' : 
                           story.state === StoryState.InProgress ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                         }`}>
                           {story.state}
                         </span>
                       </Link>
                     </li>
                   ))}
                 </ul>
              ) : <p className="text-gray-500">No stories assigned to this team.</p>}
          </Card>
          {(canDeleteTeam || currentUser?.role === Role.Admin || currentUser?.role === Role.HR) && (
            <Card title="Danger Zone" className="border-red-500 border-2">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-gray-800">Delete Team</h4>
                        <p className="text-sm text-gray-500">This action is permanent and cannot be undone.</p>
                    </div>
                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                    >
                        Delete
                    </button>
                </div>
            </Card>
          )}
        </div>
        <div className="lg:col-span-1">
          <Card title={
            <div className="flex justify-between items-center">
              <span>Team Members</span>
              {canEditTeam && (
                <button
                  onClick={() => { setSelectedUserIds([]); setIsAddMemberModalOpen(true); }}
                  className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition-colors shadow-sm"
                >
                  + Add Member
                </button>
              )}
            </div>
          }>
            <ul className="space-y-3">
              {members.map(member => (
                <li key={member.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md group">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                    {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                  </div>
                  <div className="flex-grow">
                    {currentUser?.role === Role.Admin || currentUser?.role === Role.HR ? (
                        <Link to={`/profile/${member.id}`} className="font-medium text-blue-600 hover:underline">{member.firstName} {member.lastName}</Link>
                    ) : (
                        <span className="font-medium text-gray-800">{member.firstName} {member.lastName}</span>
                    )}
                    <p className="text-xs text-gray-500">{member.jobTitle}</p>
                    {member.id === team.leadId && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded">Team Lead</span>
                    )}
                  </div>
                  {canEditTeam && member.id !== team.leadId && (
                    <button
                      onClick={() => handleRemoveMemberClick(member.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800 text-sm font-medium"
                      title="Remove member"
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        title={`Add Members to ${team.name}`}
        size="md"
      >
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {availableUsers.filter(u => !u.teamId).length > 0 ? (
            availableUsers.filter(u => !u.teamId).map(user => (
              <div key={user.id} className="flex items-center p-2 rounded-md hover:bg-gray-100">
                <input
                  type="checkbox"
                  id={`add-member-${user.id}`}
                  checked={selectedUserIds.includes(user.id)}
                  onChange={() => handleMemberSelect(user.id)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`add-member-${user.id}`} className="ml-3 flex-grow cursor-pointer">
                  <span className="font-medium text-gray-800">{user.firstName} {user.lastName}</span>
                  <span className="text-sm text-gray-500 block">{user.jobTitle}</span>
                </label>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center p-4">No available employees to add.</p>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setIsAddMemberModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
          <button onClick={handleAddMembers} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Add Selected</button>
        </div>
      </Modal>

      {editingTeam && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Team Details">
          <div className="space-y-4">
            <FormField id="name" label="Team Name" value={editingTeam.name} onChange={handleTeamFormChange} required />
            <FormField id="leadId" label="Team Lead" as="select" value={editingTeam.leadId} onChange={handleTeamFormChange} required>
              <option value="">Select a Team Lead</option>
              {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>
              ))}
            </FormField>
          </div>
          <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
              <button onClick={handleSaveChanges} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Save Changes</button>
          </div>
        </Modal>
      )}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Team Deletion"
        size="sm"
      >
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <p className="text-sm text-gray-600">
                Are you sure you want to permanently delete the <strong className="font-semibold text-red-700">{team.name}</strong> team? This will unassign all members and stories. This action is <strong className="font-semibold text-red-700">permanent and cannot be undone</strong>.
            </p>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium">Cancel</button>
          <button onClick={handleDeleteTeam} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Delete Team</button>
        </div>
      </Modal>

      <Modal
        isOpen={isRemoveMemberModalOpen}
        onClose={() => {
          setIsRemoveMemberModalOpen(false);
          setMemberToRemove(null);
        }}
        title="Remove Team Member"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsRemoveMemberModalOpen(false);
                setMemberToRemove(null);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleRemoveMember}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Remove
            </button>
          </div>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to remove <strong>{memberToRemove ? users.find(u => u.id === memberToRemove)?.firstName + ' ' + users.find(u => u.id === memberToRemove)?.lastName : 'this member'}</strong> from the team? They will be unassigned from all team stories.
        </p>
      </Modal>
    </>
  );
};

export default TeamDetail;