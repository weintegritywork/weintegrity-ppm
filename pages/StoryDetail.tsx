import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { SettingsContext } from '../context/SettingsContext';
import { Story, Role, StoryState, StoryPriority } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import ChatBox from '../components/ChatBox';
import SelectDropdown from '../components/SelectDropdown';
import PageHeader from '../components/PageHeader';

type Tab = 'Description' | 'Work Notes' | 'Attachments' | 'Chat' | 'Audit Info';

const StoryDetail: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const authContext = useContext(AuthContext);
  const toastContext = useContext(ToastContext);
  const settingsContext = useContext(SettingsContext);

  const [activeTab, setActiveTab] = useState<Tab>('Description');
  const [story, setStory] = useState<Story | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const [workNoteSaveStatus, setWorkNoteSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const workNoteSaveTimeoutRef = useRef<number | null>(null);


  if (!dataContext || !authContext || !toastContext || !settingsContext) return <div>Loading...</div>;

  const { stories, users, teams, projects, updateStory, deleteStory, notifications, deleteNotification } = dataContext;
  const { currentUser } = authContext;
  const { settings } = settingsContext;
  
  const originalStory = useMemo(() => stories.find(s => s.id === storyId), [storyId, stories]);

  useEffect(() => {
    if (originalStory) {
      setStory({ ...originalStory });
    }
  }, [originalStory]);

  useEffect(() => {
    if (currentUser && storyId) {
        const storyNotifications = notifications.filter(n => 
            n.userId === currentUser.id && 
            n.link === `/stories/${storyId}`
        );
        // Delete notifications when navigating to the story
        storyNotifications.forEach(n => deleteNotification(n.id));
    }
  }, [storyId, currentUser, notifications, deleteNotification]);
  
  // Auto-save logic for Work Notes
  useEffect(() => {
    if (!story || !originalStory || story.workNotes === originalStory.workNotes) {
        return;
    }

    setWorkNoteSaveStatus('saving');

    if (workNoteSaveTimeoutRef.current) {
        clearTimeout(workNoteSaveTimeoutRef.current);
    }

    workNoteSaveTimeoutRef.current = window.setTimeout(async () => {
        try {
          await updateStory(story.id, { 
              workNotes: story.workNotes, 
              updatedById: currentUser!.id // Also update who last touched it
          });
          setWorkNoteSaveStatus('saved');
          setTimeout(() => setWorkNoteSaveStatus('idle'), 2000);
        } catch (error) {
          setWorkNoteSaveStatus('error');
        }
    }, 1200); // 1.2 second debounce

    return () => {
        if (workNoteSaveTimeoutRef.current) {
            clearTimeout(workNoteSaveTimeoutRef.current);
        }
    };
  }, [story?.workNotes, story?.id, originalStory, updateStory, currentUser]);


  const permissions = useMemo(() => {
    const defaultPerms = { canEdit: false, canDelete: false, canChangeState: false };
    if (!currentUser || !story) return defaultPerms;

    const userPermissions = settings.accessControl[currentUser.role];
    const project = projects.find(p => p.id === story.projectId);
    
    const isAdmin = currentUser.role === Role.Admin;
    const isOwner = project?.ownerId === currentUser.id;
    const myTeam = teams.find(t => t.leadId === currentUser.id);
    const isTeamLead = currentUser.role === Role.TeamLead && story.assignedTeamId === myTeam?.id;
    const isAssigned = story.assignedToId === currentUser.id;

    const canEdit = userPermissions.canEditStory && (isAdmin || isOwner || isTeamLead);
    const canDelete = userPermissions.canDeleteStory && (isAdmin || isOwner);
    const canChangeState = isAssigned || canEdit;

    return { canEdit, canDelete, canChangeState };
  }, [currentUser, story, teams, projects, settings]);

  
  const chatPermissions = useMemo(() => {
    if (!currentUser || !story) return { canView: false, canChat: false };

    const project = projects.find(p => p.id === story.projectId);
    const isOwner = project?.ownerId === currentUser.id;

    const isAdmin = currentUser.role === Role.Admin;
    const isHr = currentUser.role === Role.HR;
    const isAssigned = story.assignedToId === currentUser.id;
    const myTeam = teams.find(t => t.leadId === currentUser.id);
    const isTeamLead = currentUser.role === Role.TeamLead && story.assignedTeamId === myTeam?.id;
    
    return {
        canView: isAdmin || isHr || isAssigned || isTeamLead || isOwner,
        canChat: isAdmin || isHr || isAssigned || isTeamLead || isOwner,
    };
  }, [currentUser, story, teams, projects]);


  if (!story) return <div>Story not found.</div>;

  const getUserName = (id?: string) => users.find(u => u.id === id);
  const createdBy = getUserName(story.createdById);
  const canViewProfiles = currentUser?.role === Role.Admin || currentUser?.role === Role.HR;
  const isAssignedToMe = currentUser?.id === story.assignedToId;

  const handleChange = (name: keyof Story, value: any) => {
    if (!story) return;
    
    let progress = story.progress || 0;
    if (name === 'state') {
        switch(value) {
            case StoryState.Done: progress = 100; break;
            case StoryState.InProgress: progress = 50; break;
            case StoryState.Test: progress = 80; break;
            case StoryState.Ready: progress = 10; break;
            case StoryState.Draft: progress = 0; break;
        }
    }
    setStory({ ...story, [name]: value, progress });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    handleChange(name as keyof Story, value);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      // Main save button saves everything, including any pending work notes changes.
      await updateStory(story.id, { ...story, updatedById: currentUser!.id });
      setSaveStatus('saved');
      toastContext.addToast('Story saved successfully!', 'success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      toastContext.addToast('Failed to save story. Please try again.', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteStory(story.id);
      toastContext.addToast('Story deleted.', 'info');
      navigate('/stories');
    } catch (error) {
      toastContext.addToast('Failed to delete story. Please try again.', 'error');
    }
  };
  
  const DetailItem: React.FC<{ label: string; children: React.ReactNode, className?: string }> = ({ label, children, className }) => (
    <div className={className}>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{children || 'N/A'}</dd>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Description':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea id="description" name="description" value={story.description} onChange={handleInputChange} disabled={!permissions.canEdit} className="w-full p-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" rows={8} />
            </div>
            <div>
              <label htmlFor="acceptanceCriteria" className="block text-sm font-medium text-gray-700 mb-1">Acceptance Criteria</label>
              <textarea id="acceptanceCriteria" name="acceptanceCriteria" value={story.acceptanceCriteria || ''} onChange={handleInputChange} disabled={!permissions.canEdit} className="w-full p-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" rows={5} />
            </div>
          </div>
        );
      case 'Work Notes':
        const getStatusIndicator = () => {
            switch(workNoteSaveStatus) {
                case 'saving': return <span className="text-yellow-600">Saving...</span>;
                case 'saved': return <span className="text-green-600">Saved</span>;
                default: return <span className="text-gray-500">Changes are saved automatically.</span>;
            }
        };
        return (
          <div>
            <textarea
              name="workNotes"
              value={story.workNotes || ''}
              onChange={handleInputChange}
              className="w-full p-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={10}
              placeholder="Add your personal work notes here. Only you can see this."
            />
            <div className="text-right text-xs mt-1 h-4">
                {getStatusIndicator()}
            </div>
          </div>
        );
      case 'Attachments':
        return <div className="text-gray-500">Attachment functionality placeholder.</div>;
      case 'Audit Info':
        const updatedBy = getUserName(story.updatedById);
        return (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-bold">Created By:</span> {createdBy ? `${createdBy.firstName} ${createdBy.lastName}` : 'Unknown'}</div>
            <div><span className="font-bold">Created On:</span> {new Date(story.createdOn).toLocaleString()}</div>
            <div><span className="font-bold">Updated By:</span> {updatedBy ? `${updatedBy.firstName} ${updatedBy.lastName}`: 'Unknown'}</div>
            <div><span className="font-bold">Updated On:</span> {new Date(story.updatedOn).toLocaleString()}</div>
          </div>
        );
      case 'Chat':
        return <ChatBox chatId={story.id} chatType="story" permissions={chatPermissions} />;
    }
  };
  
  const tabs: Tab[] = ['Description', 'Attachments', 'Chat', 'Audit Info'];
  if (isAssignedToMe) {
    tabs.splice(1, 0, 'Work Notes');
  }

  return (
    <div>
      <PageHeader
        title={`Story: ${story.number}`}
        showBackButton
        actions={
          <div className="flex items-center gap-2">
            {permissions.canEdit && (
              <button
                onClick={handleSave}
                disabled={saveStatus !== 'idle'}
                className={`px-4 py-2 rounded-lg text-white transition-colors shadow ${
                  saveStatus === 'saved' ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'
                } disabled:bg-gray-400`}
              >
                {saveStatus === 'idle' && 'Save'}
                {saveStatus === 'saving' && 'Saving...'}
                {saveStatus === 'saved' && 'Saved!'}
              </button>
            )}
            {permissions.canDelete && (
              <button onClick={() => setIsDeleteModalOpen(true)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow">Delete</button>
            )}
          </div>
        }
      />

      <Card>
        <div className="border-b border-gray-200 pb-4 mb-4">
            <div className="flex items-end justify-between gap-4">
                <input name="shortDescription" value={story.shortDescription} onChange={handleInputChange} disabled={!permissions.canEdit} className="flex-grow text-2xl font-bold text-gray-800 p-1 bg-transparent disabled:bg-gray-50 disabled:border-transparent border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded" />
                {createdBy && (
                  <p className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">
                    Created by: {canViewProfiles ? (
                        <Link to={`/profile/${createdBy.id}`} className="font-medium text-blue-600 hover:underline">{`${createdBy.firstName} ${createdBy.lastName}`}</Link>
                    ) : (
                        <span className="font-medium text-gray-800">{`${createdBy.firstName} ${createdBy.lastName}`}</span>
                    )}
                  </p>
                )}
            </div>
        </div>
        
        <div className="mb-4">
            <label className="text-sm font-medium text-gray-500">Progress</label>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${story.progress || 0}%` }}></div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Left Column */}
            <div className="space-y-4">
                <DetailItem label="State">
                    <SelectDropdown
                        value={story.state}
                        onChange={(value) => handleChange('state', value)}
                        options={Object.values(StoryState).map(s => ({ value: s, label: s}))}
                        disabled={!permissions.canChangeState}
                    />
                </DetailItem>
                <DetailItem label="Project">
                  {(() => {
                    const project = projects.find(p => p.id === story.projectId);
                    if (project) {
                      return <Link to={`/projects/${project.id}`} className="text-blue-600 hover:underline">{project.name}</Link>;
                    }
                    return 'N/A';
                  })()}
                </DetailItem>
                <DetailItem label="Assigned Team">
                  {(() => {
                    const team = teams.find(t => t.id === story.assignedTeamId);
                    if (team) {
                      return <Link to={`/teams/${team.id}`} className="text-blue-600 hover:underline">{team.name}</Link>;
                    }
                    return 'N/A';
                  })()}
                </DetailItem>
                <DetailItem label="Deadline">
                    {story.deadline ? new Date(story.deadline).toLocaleDateString() : 'N/A'}
                </DetailItem>
            </div>
            {/* Right Column */}
            <div className="space-y-4">
                <DetailItem label="Priority">
                     <SelectDropdown
                        value={story.priority}
                        onChange={(value) => handleChange('priority', value)}
                        options={Object.values(StoryPriority).map(p => ({ value: p, label: p}))}
                        disabled={!permissions.canEdit}
                    />
                </DetailItem>
                 <DetailItem label="Assigned To">
                    {(() => {
                        const user = getUserName(story.assignedToId);
                        if (!user) return 'N/A';
                        return canViewProfiles ? (
                            <Link to={`/profile/${user.id}`} className="text-blue-600 hover:underline">
                                {user.firstName} {user.lastName}
                            </Link>
                        ) : (
                            <span className="text-gray-900">{user.firstName} {user.lastName}</span>
                        );
                    })()}
                </DetailItem>
                 <DetailItem label="Tested By">
                    {(() => {
                        const user = getUserName(story.testedById);
                        if (!user) return 'N/A';
                        return canViewProfiles ? (
                            <Link to={`/profile/${user.id}`} className="text-blue-600 hover:underline">
                                {user.firstName} {user.lastName}
                            </Link>
                        ) : (
                            <span className="text-gray-900">{user.firstName} {user.lastName}</span>
                        );
                    })()}
                </DetailItem>
            </div>
        </div>

        <div className="mt-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
          <div className="pt-6">
            {renderTabContent()}
          </div>
        </div>
      </Card>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <p className="text-sm text-gray-600">
                Are you sure you want to delete this story? This action is <strong className="font-semibold text-red-700">permanent and cannot be undone</strong>.
            </p>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Delete Story</button>
        </div>
      </Modal>
    </div>
  );
};

export default StoryDetail;