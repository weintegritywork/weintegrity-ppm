import { Project, Story, Sprint, Notification } from '../types';

export const checkDeadlines = (
  projects: Project[],
  stories: Story[],
  sprints: Sprint[],
  existingNotifications: Notification[]
): Omit<Notification, 'id' | 'timestamp' | 'isRead'>[] => {
  const newNotifications: Omit<Notification, 'id' | 'timestamp' | 'isRead'>[] = [];
  const now = new Date();
  
  // Helper to check if notification already exists
  const notificationExists = (userId: string, message: string) => {
    return existingNotifications.some(n => 
      n.userId === userId && 
      n.message === message &&
      new Date(n.timestamp).getTime() > now.getTime() - 24 * 60 * 60 * 1000 // Within last 24 hours
    );
  };

  // Check project deadlines (3 days warning)
  projects.forEach(project => {
    const endDate = new Date(project.endDate);
    const daysUntilDeadline = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline > 0 && daysUntilDeadline <= 3) {
      const message = `Project "${project.name}" deadline is in ${daysUntilDeadline} day${daysUntilDeadline > 1 ? 's' : ''}!`;
      
      // Notify owner
      if (!notificationExists(project.ownerId, message)) {
        newNotifications.push({
          userId: project.ownerId,
          message,
          link: `/projects/${project.id}`,
        });
      }
      
      // Notify all members
      project.memberIds.forEach(memberId => {
        if (memberId !== project.ownerId && !notificationExists(memberId, message)) {
          newNotifications.push({
            userId: memberId,
            message,
            link: `/projects/${project.id}`,
          });
        }
      });
    }
  });

  // Check story deadlines (2 days warning) - only if story has a sprint with end date
  stories.forEach(story => {
    if (story.sprintId) {
      const sprint = sprints.find(s => s.id === story.sprintId);
      if (sprint) {
        const endDate = new Date(sprint.endDate);
        const daysUntilDeadline = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDeadline > 0 && daysUntilDeadline <= 2 && story.assignedToId) {
          const message = `Story "${story.shortDescription}" is due in ${daysUntilDeadline} day${daysUntilDeadline > 1 ? 's' : ''}!`;
          
          if (!notificationExists(story.assignedToId, message)) {
            newNotifications.push({
              userId: story.assignedToId,
              message,
              link: `/stories/${story.id}`,
            });
          }
        }
      }
    }
  });

  // Check sprint deadlines (1 day warning)
  sprints.forEach(sprint => {
    const endDate = new Date(sprint.endDate);
    const daysUntilDeadline = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline === 1) {
      const project = projects.find(p => p.id === sprint.projectId);
      if (project) {
        const message = `Sprint "${sprint.name}" ends tomorrow!`;
        
        // Notify project owner and members
        [project.ownerId, ...project.memberIds].forEach(userId => {
          if (!notificationExists(userId, message)) {
            newNotifications.push({
              userId,
              message,
              link: `/projects/${project.id}`,
            });
          }
        });
      }
    }
  });

  return newNotifications;
};
