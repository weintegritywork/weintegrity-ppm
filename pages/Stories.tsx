import React, { useContext, useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { SettingsContext } from '../context/SettingsContext';
import Card from '../components/Card';
import Table from '../components/Table';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { Story, Role, StoryState, StoryPriority, StoryType } from '../types';
import SelectDropdown from '../components/SelectDropdown';
import PageHeader from '../components/PageHeader';

const Stories: React.FC = () => {
  const dataContext = useContext(DataContext);
  const authContext = useContext(AuthContext);
  const toastContext = useContext(ToastContext);
  const settingsContext = useContext(SettingsContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [filters, setFilters] = useState({
    search: '',
    state: '',
    priority: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'my'>('all');
  
  const initialStoryState = {
    shortDescription: '',
    description: '',
    acceptanceCriteria: '',
    projectId: '',
    assignedTeamId: '',
    assignedToId: '',
    priority: StoryPriority.Moderate,
    type: StoryType.Feature,
    storyPoints: 0,
    deadline: '',
  };
  const [newStoryData, setNewStoryData] = useState(initialStoryState);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isCreating, setIsCreating] = useState(false);

  if (!dataContext || !authContext || !toastContext || !settingsContext) return <div>Loading...</div>;

  const { stories, users, teams, projects, addStory } = dataContext;
  const { currentUser } = authContext;
  const { settings } = settingsContext;

  useEffect(() => {
    const prefilter = location.state?.prefilter as StoryState | undefined;
    const storiesFilter = location.state?.storiesFilter as 'my' | 'all' | undefined;

    if (prefilter) {
        setFilters(prev => ({...prev, state: prefilter}));
    }
    if (storiesFilter) {
      setAssignmentFilter(storiesFilter);
    }
    
    // Clear the state from history so the filter isn't sticky on refresh/re-navigate
    if (location.state?.prefilter || location.state?.storiesFilter) {
        navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const visibleStories = useMemo(() => {
    if (!currentUser) return [];
    const { role } = currentUser;

    if (role === Role.Admin || role === Role.HR) {
      return stories;
    }
    if (role === Role.ProductOwner) {
        const myProjectIds = projects.filter(p => p.ownerId === currentUser.id).map(p => p.id);
        return stories.filter(s => myProjectIds.includes(s.projectId));
    }
    if (role === Role.TeamLead) {
        const myTeam = teams.find(t => t.leadId === currentUser.id);
        return myTeam ? stories.filter(s => s.assignedTeamId === myTeam.id) : [];
    }
    // Employee
    return stories.filter(s => s.assignedToId === currentUser.id);
  }, [stories, currentUser, teams, projects]);
  
  const filteredStories = useMemo(() => {
    return visibleStories.filter(story => {
      const searchMatch = story.shortDescription.toLowerCase().includes(filters.search.toLowerCase()) || story.number.toLowerCase().includes(filters.search.toLowerCase());
      const stateMatch = filters.state ? story.state === filters.state : true;
      const priorityMatch = filters.priority ? story.priority === filters.priority : true;
      const assignmentMatch = assignmentFilter === 'my' ? story.assignedToId === currentUser?.id : true;
      return searchMatch && stateMatch && priorityMatch && assignmentMatch;
    });
  }, [visibleStories, filters, assignmentFilter, currentUser]);

  const handleFilterChange = (name: 'search' | 'state' | 'priority', value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const generateStoryNumber = (): string => {
    const lastStoryNumber = stories.reduce((max, story) => {
        const numPart = parseInt(story.number.split('-')[1], 10);
        return numPart > max ? numPart : max;
    }, 1000);
    return `STRY-${lastStoryNumber + 1}`;
  };

  const handleOpenModal = () => {
    setNewStoryData(initialStoryState);
    setFormErrors({});
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => setIsModalOpen(false);

  const handleNewStoryChange = (name: string, value: any) => {
    setNewStoryData(prev => {
      const newState = { ...prev, [name]: value };
      if (name === 'projectId') {
        newState.assignedTeamId = '';
        newState.assignedToId = '';
      }
      if (name === 'assignedTeamId') {
        newState.assignedToId = '';
      }
      return newState;
    });
  };

  const validateNewStory = () => {
    const errors: { [key: string]: string } = {};
    if (!newStoryData.shortDescription.trim()) errors.shortDescription = 'Short description is required.';
    if (!newStoryData.projectId) errors.projectId = 'Please select a project.';
    if (!newStoryData.assignedTeamId) errors.assignedTeamId = 'Please select a team.';
    if (!newStoryData.assignedToId) errors.assignedToId = 'Please assign to a user.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleNewStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateNewStory()) {
        toastContext.addToast('Please fix the errors before submitting.', 'error');
        return;
    }

    const newStory: Story = {
        id: `story-${Date.now()}`,
        number: generateStoryNumber(),
        shortDescription: newStoryData.shortDescription,
        description: newStoryData.description,
        acceptanceCriteria: newStoryData.acceptanceCriteria,
        state: StoryState.Draft,
        priority: newStoryData.priority,
        type: newStoryData.type,
        storyPoints: Number(newStoryData.storyPoints),
        deadline: newStoryData.deadline,
        assignedTeamId: newStoryData.assignedTeamId,
        assignedToId: newStoryData.assignedToId,
        projectId: newStoryData.projectId,
        createdById: currentUser!.id,
        updatedById: currentUser!.id,
        createdOn: new Date().toISOString(),
        updatedOn: new Date().toISOString(),
        progress: 0,
    };

    setIsCreating(true);
    try {
      await addStory(newStory);
      toastContext.addToast('Story created successfully!', 'success');
      handleCloseModal();
    } catch (error) {
      toastContext.addToast('Failed to create story. Please try again.', 'error');
    } finally {
      setIsCreating(false);
    }
  };
  
  const availableTeamsForProject = useMemo(() => {
    if (!newStoryData.projectId) return [];
    return teams.filter(t => t.projectId === newStoryData.projectId);
  }, [teams, newStoryData.projectId]);

  const availableMembersForTeam = useMemo(() => {
    if (!newStoryData.assignedTeamId) return [];
    const team = teams.find(t => t.id === newStoryData.assignedTeamId);
    if (!team) return [];
    return users.filter(u => team.memberIds.includes(u.id));
  }, [users, teams, newStoryData.assignedTeamId]);
  
  const canCreateStory = currentUser && settings?.accessControl?.[currentUser.role]?.canCreateStory === true;

  const today = new Date().toISOString().split('T')[0];

  const columns = [
    { key: 'number', header: 'Number' },
    { key: 'shortDescription', header: 'Description' },
    { 
        key: 'project', 
        header: 'Project', 
        render: (s: Story) => projects.find(p => p.id === s.projectId)?.name || 'N/A'
    },
    { key: 'assignedTeam', header: 'Team', render: (s: Story) => teams.find(t => t.id === s.assignedTeamId)?.name || 'N/A' },
    { key: 'assignedTo', header: 'Assigned To', render: (s: Story) => {
        const user = users.find(u => u.id === s.assignedToId);
        return user ? `${user.firstName} ${user.lastName}` : 'N/A';
    }},
    { key: 'state', header: 'State', render: (s: Story) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            s.state === StoryState.Done ? 'bg-green-100 text-green-800' : 
            s.state === StoryState.InProgress ? 'bg-yellow-100 text-yellow-800' :
            s.state === StoryState.Test ? 'bg-blue-100 text-blue-800' :
            s.state === StoryState.Blocked ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
        }`}>{s.state}</span>
    )},
    { key: 'priority', header: 'Priority', render: (s: Story) => {
        let colorClass = '';
        switch (s.priority) {
          case StoryPriority.Critical:
            colorClass = 'bg-red-100 text-red-800';
            break;
          case StoryPriority.High:
            colorClass = 'bg-orange-100 text-orange-800';
            break;
          case StoryPriority.Moderate:
            colorClass = 'bg-blue-100 text-blue-800';
            break;
          case StoryPriority.Low:
            colorClass = 'bg-gray-100 text-gray-800';
            break;
        }
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
            {s.priority}
          </span>
        );
      }
    },
    { key: 'storyPoints', header: 'Points' },
  ];

  return (
    <>
      <PageHeader
        title={assignmentFilter === 'my' ? 'My Stories' : 'All Stories'}
        showBackButton={false}
        actions={
          canCreateStory && (
            <button onClick={handleOpenModal} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
              + New Story
            </button>
          )
        }
      />
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input type="text" name="search" placeholder="Search by number or description..." value={filters.search} onChange={e => handleFilterChange('search', e.target.value)} className="p-2 border bg-white rounded-lg w-full" />
          <SelectDropdown
            value={filters.state}
            onChange={(value) => handleFilterChange('state', value)}
            options={[{value: '', label: 'All States'}, ...Object.values(StoryState).map(s => ({ value: s, label: s }))]}
            placeholder="All States"
          />
          <SelectDropdown
            value={filters.priority}
            onChange={(value) => handleFilterChange('priority', value)}
            options={[{value: '', label: 'All Priorities'}, ...Object.values(StoryPriority).map(p => ({ value: p, label: p }))]}
            placeholder="All Priorities"
          />
        </div>
        <Table<Story>
          columns={columns}
          data={filteredStories}
          rowKey="id"
          onRowClick={(story) => navigate(`/stories/${story.id}`)}
        />
      </Card>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Create New Story" size="xl">
        <form onSubmit={handleNewStorySubmit} className="space-y-4">
            <FormField id="shortDescription" label="Short Description" value={newStoryData.shortDescription} onChange={e => handleNewStoryChange('shortDescription', e.target.value)} required error={formErrors.shortDescription} />
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project {formErrors.projectId && <span className="text-red-500">*</span>}</label>
                <SelectDropdown
                    value={newStoryData.projectId}
                    onChange={(value) => handleNewStoryChange('projectId', value)}
                    options={projects.map(p => ({ value: p.id, label: p.name }))}
                    placeholder="Select a Project"
                />
                {formErrors.projectId && <p className="mt-1 text-sm text-red-600">{formErrors.projectId}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Team {formErrors.assignedTeamId && <span className="text-red-500">*</span>}</label>
                    <SelectDropdown
                        value={newStoryData.assignedTeamId}
                        onChange={(value) => handleNewStoryChange('assignedTeamId', value)}
                        options={availableTeamsForProject.map(t => ({ value: t.id, label: t.name }))}
                        placeholder={newStoryData.projectId ? 'Select a Team' : 'Select a Project first'}
                        disabled={!newStoryData.projectId}
                    />
                    {formErrors.assignedTeamId && <p className="mt-1 text-sm text-red-600">{formErrors.assignedTeamId}</p>}
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To {formErrors.assignedToId && <span className="text-red-500">*</span>}</label>
                    <SelectDropdown
                        value={newStoryData.assignedToId}
                        onChange={(value) => handleNewStoryChange('assignedToId', value)}
                        options={availableMembersForTeam.map(m => ({ value: m.id, label: `${m.firstName} ${m.lastName}` }))}
                        placeholder={newStoryData.assignedTeamId ? 'Select a Member' : 'Select a Team first'}
                        disabled={!newStoryData.assignedTeamId}
                    />
                    {formErrors.assignedToId && <p className="mt-1 text-sm text-red-600">{formErrors.assignedToId}</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <SelectDropdown
                        value={newStoryData.priority}
                        onChange={(value) => handleNewStoryChange('priority', value)}
                        options={Object.values(StoryPriority).map(p => ({ value: p, label: p }))}
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <SelectDropdown
                        value={newStoryData.type}
                        onChange={(value) => handleNewStoryChange('type', value)}
                        options={Object.values(StoryType).map(t => ({ value: t, label: t }))}
                    />
                </div>
                <FormField id="storyPoints" label="Story Points" type="number" value={newStoryData.storyPoints} onChange={e => handleNewStoryChange('storyPoints', e.target.value)} />
                <FormField id="deadline" label="Deadline" type="date" value={newStoryData.deadline} onChange={e => handleNewStoryChange('deadline', e.target.value)} min={today} />
            </div>
            <FormField id="description" label="Description" as="textarea" value={newStoryData.description} onChange={e => handleNewStoryChange('description', e.target.value)} />
            <FormField id="acceptanceCriteria" label="Acceptance Criteria" as="textarea" value={newStoryData.acceptanceCriteria} onChange={e => handleNewStoryChange('acceptanceCriteria', e.target.value)} />

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" disabled={isCreating}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center" disabled={isCreating}>
              {isCreating && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isCreating ? 'Creating...' : 'Create Story'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Stories;