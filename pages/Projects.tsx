

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
import { Project, ProjectStatus, Role, StoryState, Team } from '../types';
import SelectDropdown from '../components/SelectDropdown';
import PageHeader from '../components/PageHeader';

const Projects: React.FC = () => {
  const dataContext = useContext(DataContext);
  const authContext = useContext(AuthContext);
  const toastContext = useContext(ToastContext);
  const settingsContext = useContext(SettingsContext);
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    leadId: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const initialFormState = {
    name: '',
    ownerId: '',
    startDate: '',
    endDate: '',
    description: '',
    teamIds: [] as string[],
    status: ProjectStatus.NotStarted,
  };

  const [newProjectData, setNewProjectData] = useState(initialFormState);

  if (!dataContext || !authContext || !toastContext || !settingsContext) return <div>Loading...</div>;

  const { projects, users, stories, addProject, teams } = dataContext;
  const { currentUser } = authContext;
  const { settings } = settingsContext;

  const availableTeams = useMemo(() => teams.filter(t => !t.projectId), [teams]);
  
  const teamLeads = useMemo(() => {
    return users.filter(u => u.role === Role.TeamLead);
  }, [users]);


  const visibleProjects = useMemo(() => {
    if (!currentUser) return [];
    const { role } = currentUser;

    if (role === Role.Admin || role === Role.HR) {
      return projects;
    }
    if (role === Role.ProductOwner) {
      return projects.filter(p => p.ownerId === currentUser.id);
    }
    if (role === Role.TeamLead) {
        const myTeam = teams.find(t => t.leadId === currentUser.id);
        return myTeam ? projects.filter(p => p.id === myTeam.projectId) : [];
    }
    // Employee
    return projects.filter(p => p.memberIds.includes(currentUser.id));
  }, [projects, currentUser, teams]);
  
  const filteredProjects = visibleProjects.filter(p => {
    const searchMatch = p.name.toLowerCase().includes(filters.search.toLowerCase());
    const statusMatch = filters.status ? p.status === filters.status : true;
    const leadMatch = filters.leadId
        ? teams.some(team => team.projectId === p.id && team.leadId === filters.leadId)
        : true;

    return searchMatch && statusMatch && leadMatch;
  });

  const getProjectProgress = (projectId: string) => {
    const projectStories = stories.filter(s => s.projectId === projectId);
    if (projectStories.length === 0) return 0;
    const completedStories = projectStories.filter(s => s.state === StoryState.Done).length;
    return (completedStories / projectStories.length) * 100;
  };
  
  const handleOpenModal = () => {
    setNewProjectData(initialFormState);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => setIsModalOpen(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setNewProjectData(prev => ({...prev, [e.target.name]: e.target.value }));
  };

  const handleFilterChange = (name: 'search' | 'status' | 'leadId', value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTeamSelect = (teamId: string) => {
    setNewProjectData(prev => {
        const newTeamIds = prev.teamIds.includes(teamId)
            ? prev.teamIds.filter(id => id !== teamId)
            : [...prev.teamIds, teamId];
        return {...prev, teamIds: newTeamIds};
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectData.name || !newProjectData.startDate || !newProjectData.endDate) {
        toastContext.addToast('Please fill all required fields.', 'error');
        return;
    }
    if (newProjectData.teamIds.length === 0) {
        toastContext.addToast('A project must be assigned to at least one team.', 'error');
        return;
    }
    if (new Date(newProjectData.endDate) < new Date(newProjectData.startDate)) {
      toastContext.addToast('End date cannot be before start date.', 'error');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(newProjectData.endDate);
    endDate.setHours(0, 0, 0, 0);
    if (endDate < today) {
      toastContext.addToast('End date cannot be in the past.', 'error');
      return;
    }

    // Determine the final owner ID (use selected owner or current user)
    const finalOwnerId = newProjectData.ownerId && newProjectData.ownerId.trim() !== '' 
      ? newProjectData.ownerId 
      : currentUser!.id;
    
    // Aggregate member IDs from selected teams
    const memberIdsFromTeams = teams
      .filter(team => newProjectData.teamIds.includes(team.id))
      .flatMap(team => team.memberIds);
      
    // Combine with owner and remove duplicates
    const allMemberIds = Array.from(new Set([...memberIdsFromTeams, finalOwnerId]));
    const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: newProjectData.name,
        ownerId: finalOwnerId,
        startDate: newProjectData.startDate,
        endDate: newProjectData.endDate,
        description: newProjectData.description,
        memberIds: allMemberIds,
        status: newProjectData.status,
    };
    try {
      await addProject(newProject, newProjectData.teamIds);
      toastContext.addToast('Project created successfully!', 'success');
      handleCloseModal();
    } catch (error) {
      console.error('Project creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project. Please try again.';
      toastContext.addToast(errorMessage, 'error');
    }
  };
  
  const canCreateProject = currentUser && settings?.accessControl?.[currentUser.role]?.canCreateProject === true;

  const today = new Date().toISOString().split('T')[0];

  const columns = [
    { key: 'name', header: 'Project Name' },
    { key: 'owner', header: 'Owner', render: (p: Project) => {
        const owner = users.find(u => u.id === p.ownerId);
        return owner ? `${owner.firstName} ${owner.lastName}` : 'N/A';
    }},
    { key: 'endDate', header: 'End Date', render: (p: Project) => new Date(p.endDate).toLocaleDateString() },
    { key: 'status', header: 'Status', render: (p: Project) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            p.status === ProjectStatus.Completed ? 'bg-green-100 text-green-800' : 
            p.status === ProjectStatus.InProgress ? 'bg-blue-100 text-blue-800' :
            p.status === ProjectStatus.OnHold ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
        }`}>{p.status}</span>
    )},
    { key: 'progress', header: 'Progress', render: (p: Project) => {
        const progress = getProjectProgress(p.id);
        return (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
        );
    }},
    { key: 'members', header: 'Members', render: (p: Project) => p.memberIds.length }
  ];

  return (
    <>
      <PageHeader
        title="Projects"
        showBackButton={false}
        actions={
          canCreateProject && (
            <button
              onClick={handleOpenModal}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
            >
              + New Project
            </button>
          )
        }
      />
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by project name..."
            value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
            className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none"
          />
          <SelectDropdown
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              options={[{value: '', label: 'All Statuses'}, ...Object.values(ProjectStatus).map(s => ({ value: s, label: s }))]}
              placeholder="Filter by Status"
          />
          <SelectDropdown
              value={filters.leadId}
              onChange={(value) => handleFilterChange('leadId', value)}
              options={[{value: '', label: 'All Team Leads'}, ...teamLeads.map(lead => ({ value: lead.id, label: `${lead.firstName} ${lead.lastName}` }))]}
              placeholder="Filter by Team Lead"
          />
        </div>
        <Table<Project>
          columns={columns}
          data={filteredProjects}
          rowKey="id"
          onRowClick={(project) => navigate(`/projects/${project.id}`)}
        />
      </Card>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Create New Project" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormField id="name" label="Project Name" value={newProjectData.name} onChange={handleFormChange} required />
            <SelectDropdown
                label="Project Owner (Optional)"
                value={newProjectData.ownerId}
                onChange={(value) => setNewProjectData(prev => ({...prev, ownerId: value }))}
                options={[
                    { value: '', label: 'N/A' },
                    ...users
                        .filter(u => u.role === Role.Admin || u.role === Role.ProductOwner)
                        .map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }))
                ]}
                placeholder="Select a Project Owner"
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField id="startDate" label="Start Date" type="date" value={newProjectData.startDate} onChange={handleFormChange} required />
                <FormField id="endDate" label="End Date" type="date" value={newProjectData.endDate} onChange={handleFormChange} required min={today} />
            </div>
            <FormField id="description" label="Description" as="textarea" value={newProjectData.description} onChange={handleFormChange} />
            <SelectDropdown
                label="Status"
                value={newProjectData.status}
                onChange={(value) => setNewProjectData(prev => ({...prev, status: value as ProjectStatus }))}
                options={Object.values(ProjectStatus).map(s => ({ value: s, label: s }))}
                placeholder="Select Project Status"
            />
            
            <div>
                <label className="block text-sm font-medium text-gray-700">Assign Teams *</label>
                <p className="text-xs text-gray-500 mt-1 mb-2">Note: Only teams not assigned to other projects are shown.</p>
                <div className="mt-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-2">
                    {availableTeams.length > 0 ? availableTeams.map(team => (
                        <div key={team.id} className="flex items-center">
                           <input type="checkbox" id={`team-${team.id}`} checked={newProjectData.teamIds.includes(team.id)} onChange={() => handleTeamSelect(team.id)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                           <label htmlFor={`team-${team.id}`} className="ml-3 block text-sm text-gray-700">
                                {team.name}
                           </label>
                        </div>
                    )) : <p className="text-gray-500 text-center text-sm p-2">No available teams. All teams are already assigned to projects.</p>}
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Create Project</button>
            </div>
        </form>
    </Modal>
    </>
  );
};

export default Projects;