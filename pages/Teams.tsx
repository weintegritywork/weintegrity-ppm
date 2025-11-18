import React, { useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { SettingsContext } from '../context/SettingsContext';
import Card from '../components/Card';
import Table from '../components/Table';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { Team, Role } from '../types';
import PageHeader from '../components/PageHeader';

const Teams: React.FC = () => {
  const dataContext = useContext(DataContext);
  const authContext = useContext(AuthContext);
  const toastContext = useContext(ToastContext);
  const settingsContext = useContext(SettingsContext);
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTeamData, setNewTeamData] = useState({
    name: '',
    leadId: '',
    memberIds: [] as string[],
  });

  if (!dataContext || !authContext || !toastContext || !settingsContext) return <div>Loading...</div>;

  const { teams, users, projects, addTeam } = dataContext;
  const { currentUser } = authContext;
  const { settings } = settingsContext;

  const availableUsers = useMemo(() => {
    // Filter users who don't have a teamId (null, undefined, or empty string)
    return users.filter(u => {
      const hasNoTeam = !u.teamId || u.teamId === null || u.teamId === '';
      const isNotAdminOrHR = u.role !== Role.Admin && u.role !== Role.HR;
      return hasNoTeam && isNotAdminOrHR;
    });
  }, [users]);
  
  // Auto-sync teamId for users on component mount
  React.useEffect(() => {
    const syncTeamMembers = async () => {
      let needsSync = false;
      
      // Check if any users need syncing
      for (const team of teams) {
        for (const memberId of team.memberIds) {
          const user = users.find(u => u.id === memberId);
          if (user && user.teamId !== team.id) {
            needsSync = true;
            break;
          }
        }
        if (needsSync) break;
      }
      
      // Only sync if needed
      if (needsSync) {
        try {
          for (const team of teams) {
            for (const memberId of team.memberIds) {
              const user = users.find(u => u.id === memberId);
              if (user && user.teamId !== team.id) {
                await dataContext.updateUser(memberId, { teamId: team.id });
              }
            }
          }
        } catch (error) {
          console.error('Auto-sync failed:', error);
        }
      }
    };
    
    if (teams.length > 0 && users.length > 0) {
      syncTeamMembers();
    }
  }, [teams, users, dataContext]);
  
  const visibleTeams = useMemo(() => {
    if (!currentUser) return [];
    const { role } = currentUser;
    
    if (role === Role.Admin || role === Role.HR) {
      return teams;
    }
    if (role === Role.ProductOwner) {
        const myProjectIds = projects.filter(p => p.ownerId === currentUser.id).map(p => p.id);
        return teams.filter(t => t.projectId && myProjectIds.includes(t.projectId));
    }
    if (role === Role.TeamLead) {
        return teams.filter(t => t.leadId === currentUser.id);
    }
    // Employee
    return teams.filter(t => t.memberIds.includes(currentUser.id));
  }, [teams, currentUser, projects]);

  
  const filteredTeams = visibleTeams.filter(t =>
    t.name.toLowerCase().includes(filter.toLowerCase())
  );
  
  const handleOpenModal = () => {
    setNewTeamData({ name: '', leadId: '', memberIds: [] });
    setIsModalOpen(true);
  };
  const handleCloseModal = () => setIsModalOpen(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewTeamData(prev => ({...prev, [e.target.name]: e.target.value}));
  };

  const handleMemberSelect = (userId: string) => {
    setNewTeamData(prev => {
        const newMemberIds = prev.memberIds.includes(userId) 
            ? prev.memberIds.filter(id => id !== userId)
            : [...prev.memberIds, userId];
        return {...prev, memberIds: newMemberIds};
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamData.name || !newTeamData.leadId) {
        toastContext.addToast('Team Name and Team Lead are required.', 'error');
        return;
    }
    const finalMemberIds = Array.from(new Set([...newTeamData.memberIds, newTeamData.leadId]));
    
    const newTeam: Team = {
        id: `team-${Date.now()}`,
        name: newTeamData.name,
        leadId: newTeamData.leadId,
        memberIds: finalMemberIds
    };
    try {
      await addTeam(newTeam);
      toastContext.addToast('Team created successfully!', 'success');
      handleCloseModal();
    } catch (error) {
      toastContext.addToast('Failed to create team. Please try again.', 'error');
    }
  };
  
  const canCreateTeam = currentUser && settings?.accessControl?.[currentUser.role]?.canCreateTeam === true;

  const columns = [
    { key: 'name', header: 'Team Name' },
    { key: 'lead', header: 'Team Lead', render: (t: Team) => {
        const lead = users.find(u => u.id === t.leadId);
        return lead ? `${lead.firstName} ${lead.lastName}` : 'N/A';
    }},
    { key: 'members', header: 'Members', render: (t: Team) => t.memberIds.length }
  ];

  return (
    <>
      <PageHeader
        title="Teams"
        showBackButton={false}
        actions={
          canCreateTeam && (
            <button
              onClick={handleOpenModal}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
            >
              + New Team
            </button>
          )
        }
      />
      <Card>
       <div className="mb-4">
        <input
          type="text"
          placeholder="Search by team name..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full md:w-1/3 p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>
      <Table<Team>
        columns={columns}
        data={filteredTeams}
        rowKey="id"
        onRowClick={(team) => navigate(`/teams/${team.id}`)}
      />
    </Card>
    <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Create New Team" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField id="name" label="Team Name" value={newTeamData.name} onChange={handleFormChange} required />
        <FormField id="leadId" label="Team Lead" as="select" value={newTeamData.leadId} onChange={handleFormChange} required>
            <option value="">Select a Team Lead</option>
            {availableUsers.map(user => (
                <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>
            ))}
        </FormField>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Team Members</label>
            <p className="text-xs text-gray-500 mb-2">Note: Only employees not assigned to other teams are shown.</p>
            <div className="max-h-60 overflow-y-auto p-2 border border-gray-300 rounded-md">
                {availableUsers.filter(u => u.id !== newTeamData.leadId).length > 0 ? (
                  availableUsers.filter(u => u.id !== newTeamData.leadId).map(user => (
                      <div key={user.id} className="flex items-center p-1">
                          <input
                              type="checkbox"
                              id={`member-${user.id}`}
                              checked={newTeamData.memberIds.includes(user.id)}
                              onChange={() => handleMemberSelect(user.id)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor={`member-${user.id}`} className="ml-3 text-sm text-gray-700">
                              {user.firstName} {user.lastName} <span className="text-xs text-gray-500">({user.jobTitle})</span>
                          </label>
                      </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center text-sm p-4">No available employees. All employees are already assigned to teams.</p>
                )}
            </div>
        </div>
         <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Create Team</button>
        </div>
      </form>
    </Modal>
    </>
  );
};

export default Teams;
