import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Team, Project, Story, Epic, Sprint, StoryChat, ProjectChat, ChatMessage, Notification } from '../types';
import { api } from '../utils/api';

export interface DataContextType {
  users: User[];
  teams: Team[];
  projects: Project[];
  stories: Story[];
  epics: Epic[];
  sprints: Sprint[];
  storyChats: StoryChat;
  projectChats: ProjectChat;
  notifications: Notification[];
  addUser: (user: User) => Promise<void>;
  updateUser: (userId: string, updatedData: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  addTeam: (team: Team) => Promise<void>;
  updateTeam: (teamId: string, updatedData: Partial<Team>) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  addMembersToTeam: (teamId: string, memberIds: string[]) => Promise<void>;
  addProject: (project: Project, teamIds?: string[]) => Promise<void>;
  updateProject: (projectId: string, updatedData: Partial<Project> & { teamIds?: string[] }) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  addStory: (story: Story) => Promise<void>;
  updateStory: (storyId: string, updatedData: Partial<Story>) => Promise<void>;
  deleteStory: (storyId: string) => Promise<void>;
  addChatMessage: (chatId: string, chatType: 'story' | 'project', message: ChatMessage) => Promise<void>;
  deleteChatMessage: (chatId: string, chatType: 'story' | 'project', messageId: string) => Promise<void>;
  addNotification: (notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: (userId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  fetchStoryChats: (storyId: string, forceRefresh?: boolean) => Promise<void>;
  fetchProjectChats: (projectId: string, forceRefresh?: boolean) => Promise<void>;
  isDataReady: boolean;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDataReady, setIsDataReady] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [storyChats, setStoryChats] = useState<StoryChat>({});
  const [projectChats, setProjectChats] = useState<ProjectChat>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchAllData = async () => {
    try {
      const [usersRes, teamsRes, projectsRes, storiesRes, epicsRes, sprintsRes, notificationsRes] = await Promise.allSettled([
        api.get<User[]>('users'),
        api.get<Team[]>('teams'),
        api.get<Project[]>('projects'),
        api.get<Story[]>('stories'),
        api.get<Epic[]>('epics'),
        api.get<Sprint[]>('sprints'),
        api.get<Notification[]>('notifications'),
      ]);

      // Handle each response, setting empty array if failed
      if (usersRes.status === 'fulfilled' && usersRes.value.data) setUsers(usersRes.value.data);
      else setUsers([]);
      
      if (teamsRes.status === 'fulfilled' && teamsRes.value.data) setTeams(teamsRes.value.data);
      else setTeams([]);
      
      if (projectsRes.status === 'fulfilled' && projectsRes.value.data) setProjects(projectsRes.value.data);
      else setProjects([]);
      
      if (storiesRes.status === 'fulfilled' && storiesRes.value.data) {
        setStories(storiesRes.value.data);
        // Don't fetch chats on initial load - fetch them when needed
        setStoryChats({});
      } else {
        setStories([]);
        setStoryChats({});
      }
      
      if (epicsRes.status === 'fulfilled' && epicsRes.value.data) setEpics(epicsRes.value.data);
      else setEpics([]);
      
      if (sprintsRes.status === 'fulfilled' && sprintsRes.value.data) setSprints(sprintsRes.value.data);
      else setSprints([]);
      
      if (notificationsRes.status === 'fulfilled' && notificationsRes.value.data) setNotifications(notificationsRes.value.data);
      else setNotifications([]);

      // Don't fetch chats on initial load - fetch them when needed
      setProjectChats({});
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays on error to prevent UI from breaking
      setUsers([]);
      setTeams([]);
      setProjects([]);
      setStories([]);
      setEpics([]);
      setSprints([]);
      setStoryChats({});
      setProjectChats({});
      setNotifications([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchAllData();
      setIsDataReady(true);
    };
    loadData();
    
    // Poll for notifications every 10 seconds
    const notificationInterval = setInterval(async () => {
      try {
        const notificationsRes = await api.get<Notification[]>('notifications');
        if (notificationsRes.data) {
          setNotifications(notificationsRes.data);
        }
      } catch (error) {
        // Silently fail - don't break the app if notification polling fails
        console.error('Error polling notifications:', error);
      }
    }, 10000); // Poll every 10 seconds
    
    return () => {
      clearInterval(notificationInterval);
    };
  }, []);

  const refreshData = async () => {
    await fetchAllData();
  };

  const addNotification = async (notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    
    const result = await api.post<Notification>('notifications', newNotification);
    if (result.data) {
      setNotifications(prev => [result.data!, ...prev]);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      const result = await api.put<Notification>('notifications', notificationId, { ...notification, isRead: true });
      if (result.data) {
        setNotifications(prev => prev.map(n => n.id === notificationId ? result.data! : n));
      }
    }
  };

  const markAllNotificationsAsRead = async (userId: string) => {
    const userNotifications = notifications.filter(n => n.userId === userId && !n.isRead);
    await Promise.all(userNotifications.map(n => markNotificationAsRead(n.id)));
  };

  const deleteNotification = async (notificationId: string) => {
    const result = await api.delete('notifications', notificationId);
    if (!result.error) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
  };

  const addUser = async (user: User) => {
    const result = await api.post<User>('users', user);
    if (result.data) {
      setUsers(prev => [...prev, result.data!]);
    } else {
      throw new Error(result.error || 'Failed to add user');
    }
  };

  const updateUser = async (userId: string, updatedData: Partial<User>) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const result = await api.put<User>('users', userId, { ...user, ...updatedData });
    if (result.data) {
      setUsers(prev => prev.map(u => u.id === userId ? result.data! : u));
    } else {
      throw new Error(result.error || 'Failed to update user');
    }
  };

  const deleteUser = async (userId: string) => {
    // First update all related data in backend
    const userStories = stories.filter(s => s.assignedToId === userId);
    const storyUpdatePromises = userStories.map(story =>
      api.put('stories', story.id, { ...story, assignedToId: null })
    );
    
    const userTeams = teams.filter(t => t.memberIds.includes(userId));
    const teamUpdatePromises = userTeams.map(team => {
      const updatedMemberIds = team.memberIds.filter(id => id !== userId);
      return api.put('teams', team.id, { ...team, memberIds: updatedMemberIds });
    });
    
    const userProjects = projects.filter(p => p.memberIds.includes(userId));
    const projectUpdatePromises = userProjects.map(project => {
      const updatedMemberIds = project.memberIds.filter(id => id !== userId);
      return api.put('projects', project.id, { ...project, memberIds: updatedMemberIds });
    });
    
    await Promise.all([...storyUpdatePromises, ...teamUpdatePromises, ...projectUpdatePromises]);
    
    // Now delete the user
    const result = await api.delete('users', userId);
    if (!result.error) {
      // Refresh data from backend
      const [storiesRes, teamsRes, projectsRes] = await Promise.all([
        api.get<Story[]>('stories'),
        api.get<Team[]>('teams'),
        api.get<Project[]>('projects')
      ]);
      
      if (storiesRes.data) setStories(storiesRes.data);
      if (teamsRes.data) setTeams(teamsRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
      
      setNotifications(prev => prev.filter(n => n.userId !== userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
    } else {
      throw new Error(result.error || 'Failed to delete user');
    }
  };

  const addTeam = async (team: Team) => {
    const result = await api.post<Team>('teams', team);
    if (result.data) {
      // Update users in backend to assign them to this team
      const userUpdatePromises = team.memberIds.map(userId => {
        const user = users.find(u => u.id === userId);
        if (user) {
          return api.put('users', userId, { ...user, teamId: team.id });
        }
        return Promise.resolve();
      });
      
      await Promise.all(userUpdatePromises);
      
      // Refresh users from backend
      const usersRes = await api.get<User[]>('users');
      if (usersRes.data) {
        setUsers(usersRes.data);
      }
      
      setTeams(prev => [...prev, result.data!]);
    } else {
      throw new Error(result.error || 'Failed to add team');
    }
  };

  const updateTeam = async (teamId: string, updatedData: Partial<Team>) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    
    // Convert undefined to null for proper serialization
    const sanitizedData = Object.entries(updatedData).reduce((acc, [key, value]) => {
      acc[key] = value === undefined ? null : value;
      return acc;
    }, {} as any);
    
    // If memberIds changed, update users in backend first
    if (updatedData.memberIds) {
      const removedMembers = team.memberIds.filter(id => !updatedData.memberIds!.includes(id));
      const addedMembers = updatedData.memberIds.filter(id => !team.memberIds.includes(id));
      
      const userUpdatePromises = [
        ...removedMembers.map(userId => {
          const user = users.find(u => u.id === userId);
          if (user) {
            return api.put('users', userId, { ...user, teamId: null });
          }
          return Promise.resolve();
        }),
        ...addedMembers.map(userId => {
          const user = users.find(u => u.id === userId);
          if (user) {
            return api.put('users', userId, { ...user, teamId: teamId });
          }
          return Promise.resolve();
        })
      ];
      
      await Promise.all(userUpdatePromises);
      
      // Unassign removed members from team stories in backend
      if (removedMembers.length > 0) {
        const storiesToUpdate = stories.filter(s => 
          s.assignedTeamId === teamId && s.assignedToId && removedMembers.includes(s.assignedToId)
        );
        await Promise.all(storiesToUpdate.map(story =>
          api.put('stories', story.id, { ...story, assignedToId: null })
        ));
      }
    }
    
    const result = await api.put<Team>('teams', teamId, { ...team, ...sanitizedData });
    if (result.data) {
      setTeams(prev => prev.map(t => t.id === teamId ? result.data! : t));
      
      // Refresh users and stories from backend
      if (updatedData.memberIds) {
        const [usersRes, storiesRes] = await Promise.all([
          api.get<User[]>('users'),
          api.get<Story[]>('stories')
        ]);
        
        if (usersRes.data) setUsers(usersRes.data);
        if (storiesRes.data) setStories(storiesRes.data);
      }
      
      // If projectId changed, update user projectIds accordingly
      if (updatedData.projectId !== undefined) {
        const newProjectId = updatedData.projectId;
        const oldProjectId = team.projectId;
        
        // Update all team members' projectId
        setUsers(prev => prev.map(u => {
          if (team.memberIds.includes(u.id)) {
            return { ...u, projectId: newProjectId || undefined };
          }
          return u;
        }));
        
        // If project was removed, unassign team from project stories
        if (!newProjectId && oldProjectId) {
          setStories(prev => prev.map(s => 
            s.assignedTeamId === teamId ? { ...s, assignedTeamId: undefined, assignedToId: undefined } : s
          ));
        }
      }
    } else {
      throw new Error(result.error || 'Failed to update team');
    }
  };

  const deleteTeam = async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    
    // First, update all team members in the backend to remove teamId and projectId
    const teamMembers = users.filter(u => u.teamId === teamId);
    const updatePromises = teamMembers.map(user => 
      api.put('users', user.id, { ...user, teamId: null, projectId: null })
    );
    
    // Unassign stories from this team in the backend
    const teamStories = stories.filter(s => s.assignedTeamId === teamId);
    const storyUpdatePromises = teamStories.map(story =>
      api.put('stories', story.id, { ...story, assignedTeamId: null, assignedToId: null })
    );
    
    // Wait for all updates to complete
    await Promise.all([...updatePromises, ...storyUpdatePromises]);
    
    // If team was assigned to a project, update the project's memberIds
    if (team.projectId) {
      const project = projects.find(p => p.id === team.projectId);
      if (project) {
        const updatedMemberIds = project.memberIds.filter(id => !team.memberIds.includes(id) && id !== team.leadId);
        // Only keep the owner if they exist
        const finalMemberIds = project.ownerId ? [project.ownerId, ...updatedMemberIds.filter(id => id !== project.ownerId)] : updatedMemberIds;
        await updateProject(team.projectId, { memberIds: finalMemberIds });
      }
    }
    
    // Now delete the team
    const result = await api.delete('teams', teamId);
    if (!result.error) {
      // Refresh users from backend to get updated teamId values
      const usersRes = await api.get<User[]>('users');
      if (usersRes.data) {
        setUsers(usersRes.data);
      }
      
      // Refresh stories from backend
      const storiesRes = await api.get<Story[]>('stories');
      if (storiesRes.data) {
        setStories(storiesRes.data);
      }
      
      // Remove team from local state
      setTeams(prev => prev.filter(t => t.id !== teamId));
    } else {
      throw new Error(result.error || 'Failed to delete team');
    }
  };

  const addMembersToTeam = async (teamId: string, memberIds: string[]) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    
    const updatedMemberIds = Array.from(new Set([...team.memberIds, ...memberIds]));
    await updateTeam(teamId, { memberIds: updatedMemberIds });
    // updateTeam now handles backend updates and refreshes, no need to update local state here
    
    // Create notifications for newly added members
    for (const userId of memberIds) {
      await addNotification({
        userId,
        message: `You were added to team: "${team.name}"`,
        link: `/teams/${teamId}`
      });
    }
  };

  const addProject = async (project: Project, teamIds: string[] = []) => {
    const result = await api.post<Project>('projects', project);
    if (result.data) {
      setProjects(prev => [...prev, result.data!]);
      
      // Update teams with projectId first
      if (teamIds.length > 0) {
        await Promise.all(teamIds.map(teamId => updateTeam(teamId, { projectId: project.id })));
      }
      
      // Update users with projectId (this will be done by updateTeam, but we ensure it here too)
      setUsers(prev => prev.map(u => 
        project.memberIds.includes(u.id) ? { ...u, projectId: project.id } : u
      ));
      
      // Create notifications for project members (excluding owner)
      const membersToNotify = project.memberIds.filter(id => id !== project.ownerId);
      for (const userId of membersToNotify) {
        await addNotification({
          userId,
          message: `You were added to project: "${project.name}"`,
          link: `/projects/${project.id}`
        });
      }
    } else {
      console.error('DataContext: API error', result.error);
      throw new Error(result.error || 'Failed to add project');
    }
  };

  const updateProject = async (projectId: string, updatedData: Partial<Project> & { teamIds?: string[] }) => {
    const { teamIds: newTeamIds, ...projectData } = updatedData;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // Update team associations if provided
    if (newTeamIds) {
      const originalTeamIds = teams.filter(t => t.projectId === projectId).map(t => t.id);
      const teamsToUnassign = originalTeamIds.filter(id => !newTeamIds.includes(id));
      const teamsToAssign = newTeamIds.filter(id => !originalTeamIds.includes(id));

      console.log('=== PROJECT TEAM UPDATE ===');
      console.log('Original teams:', originalTeamIds);
      console.log('New teams:', newTeamIds);
      console.log('Teams to unassign:', teamsToUnassign);
      console.log('Teams to assign:', teamsToAssign);

      await Promise.all([
        ...teamsToUnassign.map(teamId => {
          console.log(`Unassigning team ${teamId} from project ${projectId}`);
          return updateTeam(teamId, { projectId: null });
        }),
        ...teamsToAssign.map(teamId => {
          console.log(`Assigning team ${teamId} to project ${projectId}`);
          return updateTeam(teamId, { projectId: projectId });
        }),
      ]);
      
      // Refresh teams data from server to ensure consistency
      const teamsRes = await api.get<Team[]>('teams');
      if (teamsRes.data) {
        console.log('Refreshed teams from server:', teamsRes.data);
        setTeams(teamsRes.data);
      }
      console.log('=========================');
    }

    // Recalculate memberIds if teams changed
    let finalMemberIds = project.memberIds;
    if (newTeamIds) {
      // Fetch fresh teams data to ensure we have the latest memberIds
      const teamsRes = await api.get<Team[]>('teams');
      const currentTeams = teamsRes.data || teams;
      const membersFromTeams = currentTeams
        .filter(team => newTeamIds.includes(team.id))
        .flatMap(team => team.memberIds);
      const finalOwnerId = projectData.ownerId ?? project.ownerId;
      // Only add ownerId if it exists
      const ownerIds = finalOwnerId ? [finalOwnerId] : [];
      finalMemberIds = Array.from(new Set([...membersFromTeams, ...ownerIds].filter(Boolean) as string[]));
    }

    const result = await api.put<Project>('projects', projectId, { 
      ...project, 
      ...projectData, 
      memberIds: finalMemberIds 
    });
    
    if (result.data) {
      setProjects(prev => prev.map(p => p.id === projectId ? result.data! : p));
      
      // Notify newly added members if memberIds changed
      if (finalMemberIds && project.memberIds) {
        const newMembers = finalMemberIds.filter(id => !project.memberIds.includes(id));
        for (const userId of newMembers) {
          await addNotification({
            userId,
            message: `You were added to project: "${project.name}"`,
            link: `/projects/${projectId}`
          });
        }
      }
    } else {
      throw new Error(result.error || 'Failed to update project');
    }
  };

  const deleteProject = async (projectId: string) => {
    // First update teams and users in backend
    const projectTeams = teams.filter(t => t.projectId === projectId);
    const teamUpdatePromises = projectTeams.map(team =>
      api.put('teams', team.id, { ...team, projectId: null })
    );
    
    const projectUsers = users.filter(u => u.projectId === projectId);
    const userUpdatePromises = projectUsers.map(user =>
      api.put('users', user.id, { ...user, projectId: null })
    );
    
    await Promise.all([...teamUpdatePromises, ...userUpdatePromises]);
    
    // Delete related stories
    const projectStories = stories.filter(s => s.projectId === projectId);
    await Promise.all(projectStories.map(s => deleteStory(s.id)));
    
    // Now delete the project
    const result = await api.delete('projects', projectId);
    if (!result.error) {
      // Refresh data from backend
      const [teamsRes, usersRes] = await Promise.all([
        api.get<Team[]>('teams'),
        api.get<User[]>('users')
      ]);
      
      if (teamsRes.data) setTeams(teamsRes.data);
      if (usersRes.data) setUsers(usersRes.data);
      
      // Delete project chats
      setProjectChats(prev => {
        const newChats = { ...prev };
        delete newChats[projectId];
        return newChats;
      });
      
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } else {
      throw new Error(result.error || 'Failed to delete project');
    }
  };

  const addStory = async (story: Story) => {
    const result = await api.post<Story>('stories', story);
    if (result.data) {
      setStories(prev => [...prev, result.data!]);
      
      // Notify assigned user
      if (story.assignedToId) {
        await addNotification({
          userId: story.assignedToId,
          message: `You have been assigned a new story: "${story.shortDescription}"`,
          link: `/stories/${story.id}`
        });
      }
      
      // Notify team lead if story is assigned to a team
      if (story.assignedTeamId && !story.assignedToId) {
        const assignedTeam = teams.find(t => t.id === story.assignedTeamId);
        if (assignedTeam && assignedTeam.leadId) {
          await addNotification({
            userId: assignedTeam.leadId,
            message: `A new story has been assigned to your team: "${story.shortDescription}"`,
            link: `/stories/${story.id}`
          });
        }
      }
    } else {
      throw new Error(result.error || 'Failed to add story');
    }
  };

  const updateStory = async (storyId: string, updatedData: Partial<Story>) => {
    const originalStory = stories.find(s => s.id === storyId);
    if (!originalStory) return;

    const result = await api.put<Story>('stories', storyId, { 
      ...originalStory, 
      ...updatedData, 
      updatedOn: new Date().toISOString() 
    });
    
    if (result.data) {
      setStories(prev => prev.map(s => s.id === storyId ? result.data! : s));
      
      // Notification for user re-assignment
      if (updatedData.assignedToId && originalStory.assignedToId !== updatedData.assignedToId) {
        await addNotification({
          userId: updatedData.assignedToId,
          message: `You were assigned to story: "${originalStory.shortDescription}"`,
          link: `/stories/${storyId}`
        });
      }
      
      // Notification for team assignment (notify team lead)
      if (updatedData.assignedTeamId && originalStory.assignedTeamId !== updatedData.assignedTeamId) {
        const assignedTeam = teams.find(t => t.id === updatedData.assignedTeamId);
        if (assignedTeam && assignedTeam.leadId && assignedTeam.leadId !== updatedData.assignedToId) {
          await addNotification({
            userId: assignedTeam.leadId,
            message: `Story "${originalStory.shortDescription}" was assigned to your team`,
            link: `/stories/${storyId}`
          });
        }
      }
    } else {
      throw new Error(result.error || 'Failed to update story');
    }
  };

  const deleteStory = async (storyId: string) => {
    const result = await api.delete('stories', storyId);
    if (!result.error) {
      setStories(prev => prev.filter(s => s.id !== storyId));
      // Delete story chats
      setStoryChats(prev => {
        const newChats = { ...prev };
        delete newChats[storyId];
        return newChats;
      });
    } else {
      throw new Error(result.error || 'Failed to delete story');
    }
  };

  const addChatMessage = async (chatId: string, chatType: 'story' | 'project', message: ChatMessage) => {
    if (chatType === 'story') {
      const result = await api.postStoryChatMessage(chatId, message);
      if (!result.error) {
        setStoryChats(prev => {
          const newChats = { ...prev };
          if (!newChats[chatId]) newChats[chatId] = [];
          newChats[chatId] = [...newChats[chatId], message];
          return newChats;
        });
        // Refresh notifications after sending message (notifications are created on backend)
        const notificationsRes = await api.get<Notification[]>('notifications');
        if (notificationsRes.data) {
          setNotifications(notificationsRes.data);
        }
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } else if (chatType === 'project') {
      const result = await api.postProjectChatMessage(chatId, message);
      if (!result.error) {
        setProjectChats(prev => {
          const newChats = { ...prev };
          if (!newChats[chatId]) newChats[chatId] = [];
          newChats[chatId] = [...newChats[chatId], message];
          return newChats;
        });
        // Refresh notifications after sending message (notifications are created on backend)
        const notificationsRes = await api.get<Notification[]>('notifications');
        if (notificationsRes.data) {
          setNotifications(notificationsRes.data);
        }
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    }
  };

  const deleteChatMessage = async (chatId: string, chatType: 'story' | 'project', messageId: string) => {
    if (chatType === 'story') {
      const result = await api.deleteStoryChatMessage(chatId, messageId);
      if (!result.error) {
        setStoryChats(prev => {
          const newChats = { ...prev };
          if (newChats[chatId]) {
            newChats[chatId] = newChats[chatId].filter(msg => msg.id !== messageId);
          }
          return newChats;
        });
      } else {
        throw new Error(result.error || 'Failed to delete message');
      }
    } else if (chatType === 'project') {
      const result = await api.deleteProjectChatMessage(chatId, messageId);
      if (!result.error) {
        setProjectChats(prev => {
          const newChats = { ...prev };
          if (newChats[chatId]) {
            newChats[chatId] = newChats[chatId].filter(msg => msg.id !== messageId);
          }
          return newChats;
        });
      } else {
        throw new Error(result.error || 'Failed to delete message');
      }
    }
  };

  const fetchStoryChats = async (storyId: string, forceRefresh = false) => {
    // Only fetch if not already loaded (unless force refresh)
    if (storyChats[storyId] && !forceRefresh) return;
    
    try {
      const res = await api.getStoryChats(storyId);
      if (res.data) {
        setStoryChats(prev => ({
          ...prev,
          [storyId]: res.data.messages || []
        }));
      }
    } catch (error) {
      console.error(`Error fetching chats for story ${storyId}:`, error);
    }
  };

  const fetchProjectChats = async (projectId: string, forceRefresh = false) => {
    // Only fetch if not already loaded (unless force refresh)
    if (projectChats[projectId] && !forceRefresh) return;
    
    try {
      const res = await api.getProjectChats(projectId);
      if (res.data) {
        setProjectChats(prev => ({
          ...prev,
          [projectId]: res.data.messages || []
        }));
      }
    } catch (error) {
      console.error(`Error fetching chats for project ${projectId}:`, error);
    }
  };

  const value: DataContextType = {
    users, teams, projects, stories, epics, sprints, storyChats, projectChats, notifications,
    addUser, updateUser, deleteUser, addTeam, updateTeam, deleteTeam, addMembersToTeam, 
    addProject, updateProject, deleteProject, addStory, updateStory, deleteStory,
    addChatMessage, deleteChatMessage, addNotification, markNotificationAsRead, 
    markAllNotificationsAsRead, deleteNotification, refreshData, isDataReady,
    fetchStoryChats, fetchProjectChats,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
