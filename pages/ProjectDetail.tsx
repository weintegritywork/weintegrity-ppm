

import React, { useContext, useMemo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { ToastContext } from '../context/ToastContext';
import Card from '../components/Card';
import ChatBox from '../components/ChatBox';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { Role, Project } from '../types';
import PageHeader from '../components/PageHeader';
import SelectDropdown from '../components/SelectDropdown';

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const dataContext = useContext(DataContext);
  const authContext = useContext(AuthContext);
  const settingsContext = useContext(SettingsContext);
  const toastContext = useContext(ToastContext);
  const navigate = useNavigate();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<(Project & { teamIds: string[] }) | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


  if (!dataContext || !authContext || !settingsContext || !toastContext) return <div>Loading...</div>;

  const { projects, users, stories, teams, updateProject, deleteProject, notifications, deleteNotification, fetchProjectChats } = dataContext;
  const { currentUser } = authContext;
  const { settings } = settingsContext;
  const { addToast } = toastContext;

  const project = projects.find(p => p.id === projectId);

  useEffect(() => {
    if (currentUser && projectId) {
        const projectNotifications = notifications.filter(n =>
            n.userId === currentUser.id &&
            n.link === `/projects/${projectId}`
        );
        // Delete notifications when navigating to the project
        projectNotifications.forEach(n => deleteNotification(n.id));
    }
  }, [projectId, currentUser, notifications, deleteNotification]);

  // Fetch project chats when component mounts
  useEffect(() => {
    if (projectId) {
      fetchProjectChats(projectId);
    }
  }, [projectId, fetchProjectChats]);

  const projectMembers = useMemo(() => {
    return users.filter(u => project?.memberIds.includes(u.id));
  }, [users, project]);
  
  const projectStories = useMemo(() => {
    return stories.filter(s => s.projectId === projectId);
  }, [stories, projectId]);

  const chatPermissions = useMemo(() => {
    if (!currentUser || !project) return { canView: false, canChat: false };
    
    const isProjectMember = project.memberIds.includes(currentUser.id);
    const isAllowedRole = [Role.TeamLead, Role.Employee, Role.HR, Role.Admin].includes(currentUser.role);
    
    const hasAccess = isProjectMember && isAllowedRole;

    return {
      canView: hasAccess,
      canChat: hasAccess,
    };
  }, [currentUser, project]);
  
  const availableTeamsForEdit = useMemo(() => {
    return teams.filter(t => !t.projectId || t.projectId === project?.id);
  }, [teams, project]);

  if (!project) return <div>Project not found.</div>;

  const owner = users.find(u => u.id === project.ownerId);

  const handleEditClick = () => {
    const currentTeamIds = teams.filter(t => t.projectId === project.id).map(t => t.id);
    setEditingProject({ ...project, teamIds: currentTeamIds });
    setIsEditModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (editingProject) {
      setEditingProject({ ...editingProject, [e.target.name]: e.target.value });
    }
  };
  
  const handleTeamSelect = (teamId: string) => {
    if (editingProject) {
      const newTeamIds = editingProject.teamIds.includes(teamId)
        ? editingProject.teamIds.filter(id => id !== teamId)
        : [...editingProject.teamIds, teamId];
      setEditingProject({ ...editingProject, teamIds: newTeamIds });
    }
  };

  const handleSaveChanges = async () => {
    if (editingProject) {
      if (editingProject.teamIds.length === 0) {
        addToast('A project must have at least one team.', 'error');
        return;
      }
      if (new Date(editingProject.endDate) < new Date(editingProject.startDate)) {
        addToast('End date cannot be before start date.', 'error');
        return;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(editingProject.endDate);
      endDate.setHours(0, 0, 0, 0);
      if (endDate < today) {
        addToast('End date cannot be in the past.', 'error');
        return;
      }
      setIsSaving(true);
      try {
        await updateProject(project.id, editingProject);
        addToast('Project details updated!', 'success');
        setIsEditModalOpen(false);
      } catch (error) {
        addToast('Failed to update project. Please try again.', 'error');
      } finally {
        setIsSaving(false);
      }
    }
  };
  
  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      addToast('Project and all associated data deleted.', 'success');
      navigate('/projects');
    } catch (error) {
      addToast('Failed to delete project. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const canEditProject = currentUser && settings?.accessControl?.[currentUser.role]?.canEditProject === true && (currentUser.id === project.ownerId || currentUser.role === Role.Admin);
  const canDeleteProject = currentUser && settings?.accessControl?.[currentUser.role]?.canDeleteProject === true && (currentUser.id === project.ownerId || currentUser.role === Role.Admin);


  return (
    <>
      <PageHeader
        title={project.name}
        showBackButton
        actions={
          canEditProject && (
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
            <p className="text-gray-600">{project.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span className="font-semibold text-gray-500">Project Owner:</span>
                    <p className="text-gray-800">{owner ? `${owner.firstName} ${owner.lastName}` : 'N/A'}</p>
                </div>
                <div>
                    <span className="font-semibold text-gray-500">Timeline:</span>
                    <p className="text-gray-800">
                    {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                    </p>
                </div>
            </div>
          </Card>
          <Card title="Project Chat">
            <ChatBox chatId={project.id} chatType="project" permissions={chatPermissions} />
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card title="Project Members">
            <ul className="space-y-3">
              {projectMembers.map(member => {
                const memberRoles: string[] = [];

                if (project.ownerId === member.id) {
                  memberRoles.push('Product Owner');
                }

                const projectTeams = teams.filter(t => t.projectId === project.id);
                if (projectTeams.some(t => t.leadId === member.id)) {
                  memberRoles.push('Team Lead');
                }

                const isCurrentUser = currentUser?.id === member.id;

                return (
                  <li key={member.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                      {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {currentUser?.role === Role.Admin || currentUser?.role === Role.HR ? (
                            <Link to={`/profile/${member.id}`} className="font-medium text-blue-600 hover:underline">{member.firstName} {member.lastName}</Link>
                        ) : (
                            <span className="font-medium text-gray-800">{member.firstName} {member.lastName}</span>
                        )}
                        {memberRoles.length > 0 && (
                          <span className="text-xs font-semibold text-gray-600">
                            ({memberRoles.join(', ')})
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="text-xs font-bold text-green-600">(you)</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{member.jobTitle}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card title="Stories">
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {projectStories.map(story => (
                  <li key={story.id} className="p-2 bg-gray-50 rounded-md hover:bg-gray-100">
                      <Link to={`/stories/${story.id}`} className="text-sm text-blue-600 hover:underline">
                          {story.number}: {story.shortDescription}
                      </Link>
                  </li>
              ))}
            </ul>
          </Card>
          {canDeleteProject && (
            <Card title="Danger Zone" className="border-red-500 border-2">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-gray-800">Delete Project</h4>
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
      </div>
      {editingProject && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Project Details" size="lg">
            <div className="space-y-4">
                <FormField id="name" label="Project Name" value={editingProject.name} onChange={handleFormChange} required />
                <SelectDropdown
                    label="Project Owner"
                    value={editingProject.ownerId}
                    onChange={(value) => {
                        if (editingProject) {
                            setEditingProject({ ...editingProject, ownerId: value });
                        }
                    }}
                    options={[
                        { value: '', label: 'N/A' },
                        ...users
                            .filter(u => u.role === Role.Admin || u.role === Role.ProductOwner)
                            .map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }))
                    ]}
                    placeholder="Select a Project Owner"
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField id="startDate" label="Start Date" type="date" value={editingProject.startDate} onChange={handleFormChange} required />
                    <FormField id="endDate" label="End Date" type="date" value={editingProject.endDate} onChange={handleFormChange} required min={new Date().toISOString().split('T')[0]} />
                </div>
                <FormField id="description" label="Description" as="textarea" value={editingProject.description} onChange={handleFormChange} />
                <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned Teams *</label>
                    <div className="mt-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-2">
                        {availableTeamsForEdit.length > 0 ? availableTeamsForEdit.map(team => (
                            <div key={team.id} className="flex items-center">
                                <input type="checkbox" id={`team-edit-${team.id}`} checked={editingProject.teamIds.includes(team.id)} onChange={() => handleTeamSelect(team.id)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                <label htmlFor={`team-edit-${team.id}`} className="ml-3 block text-sm text-gray-700">
                                    {team.name}
                                    {team.projectId && team.projectId !== project.id && (
                                      <span className="ml-2 text-xs text-gray-400">(assigned to another project)</span>
                                    )}
                                </label>
                            </div>
                        )) : <p className="text-gray-500 text-center text-sm p-2">No available teams. All teams are assigned to other projects.</p>}
                    </div>
                </div>
            </div>
             <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" disabled={isSaving}>Cancel</button>
                <button onClick={handleSaveChanges} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center" disabled={isSaving}>
                  {isSaving && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </Modal>
      )}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Project Deletion"
        size="sm"
        footer={
            <div className="flex justify-end gap-3">
                <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                    disabled={isDeleting}
                >
                    Cancel
                </button>
                <button
                    onClick={handleDeleteProject}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 flex items-center"
                    disabled={isDeleting}
                >
                    {isDeleting && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
            </div>
        }
      >
        <p className="text-gray-600">
            Are you sure you want to permanently delete the <strong>{project.name}</strong> project? This will also delete all associated stories and unassign teams. This action cannot be undone.
        </p>
      </Modal>
    </>
  );
};

export default ProjectDetail;