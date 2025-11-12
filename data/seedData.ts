/**
 * ⚠️ DEVELOPMENT SEED DATA ONLY - DO NOT USE IN PRODUCTION
 * 
 * These are test accounts with weak passwords for local development.
 * In production:
 * 1. Never seed this data
 * 2. Create real users with strong passwords
 * 3. Force password change on first login
 * 4. Disable the /api/dev/seed/ endpoint
 */

import { User, Team, Project, Story, Epic, Sprint, StoryChat, ProjectChat, Role, StoryState, StoryPriority, StoryType, Notification, ProjectStatus, WorkLocation } from '../types';

const users: User[] = [
  { id: 'user-1', employeeId: 'admin', firstName: 'Admin', lastName: 'User', email: 'admin@example.com', phone: '111-111-1111', role: Role.Admin, department: 'IT', jobTitle: 'System Administrator', dateOfJoining: '2020-01-01', password: 'admin123', status: 'active', experience: 10, nativeLocation: 'New York, USA', workLocation: WorkLocation.WFO, skills: ['System Administration', 'Network Security', 'Cloud Computing'] },
  { id: 'user-2', employeeId: 'hr', firstName: 'HR', lastName: 'Admin', email: 'hr@example.com', phone: '222-222-2222', role: Role.HR, department: 'Human Resources', jobTitle: 'HR Manager', dateOfJoining: '2020-02-01', password: 'hr123', status: 'active', experience: 8, nativeLocation: 'Los Angeles, USA', workLocation: WorkLocation.WFO, skills: ['Recruitment', 'Employee Relations', 'HR Policies'] },
  { id: 'user-3', employeeId: 'lead', firstName: 'Team', lastName: 'Lead', email: 'lead@example.com', phone: '333-333-3333', role: Role.TeamLead, department: 'Engineering', jobTitle: 'Senior Developer', dateOfJoining: '2021-03-15', password: 'lead123', teamId: 'team-1', projectId: 'proj-1', status: 'active', experience: 7, nativeLocation: 'Chicago, USA', workLocation: WorkLocation.Remote, skills: ['JavaScript', 'React', 'Node.js', 'Team Leadership'] },
  { id: 'user-4', employeeId: 'emma', firstName: 'Emma', lastName: 'Watson', email: 'emma@example.com', phone: '444-444-4444', role: Role.Employee, department: 'Engineering', jobTitle: 'Software Engineer', dateOfJoining: '2022-05-20', password: 'emp123', teamId: 'team-1', projectId: 'proj-1', status: 'active', experience: 3, nativeLocation: 'Boston, USA', workLocation: WorkLocation.WFH, skills: ['Python', 'Django', 'PostgreSQL', 'REST APIs'] },
  { id: 'user-5', employeeId: 'liam', firstName: 'Liam', lastName: 'Smith', email: 'liam@example.com', phone: '555-555-5555', role: Role.Employee, department: 'Engineering', jobTitle: 'Frontend Developer', dateOfJoining: '2022-06-10', password: 'emp123', teamId: 'team-2', projectId: 'proj-2', status: 'active', experience: 4, nativeLocation: 'Seattle, USA', workLocation: WorkLocation.Remote, skills: ['React', 'TypeScript', 'CSS', 'Tailwind'] },
  { id: 'user-6', employeeId: 'olivia', firstName: 'Olivia', lastName: 'Jones', email: 'olivia@example.com', phone: '666-666-6666', role: Role.Employee, department: 'Design', jobTitle: 'UI/UX Designer', dateOfJoining: '2021-08-01', password: 'emp123', teamId: 'team-2', projectId: 'proj-2', status: 'active', experience: 5, nativeLocation: 'San Francisco, USA', workLocation: WorkLocation.WFH, skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping'] },
  { id: 'user-7', employeeId: 'po', firstName: 'Product', lastName: 'Owner', email: 'po@projecthub.com', phone: '777-777-7777', role: Role.ProductOwner, department: 'Product', jobTitle: 'Product Owner', dateOfJoining: '2021-01-01', password: 'po123', status: 'active', projectId: 'proj-1', experience: 6, nativeLocation: 'Austin, USA', workLocation: WorkLocation.WFO, skills: ['Product Strategy', 'Agile', 'Stakeholder Management', 'Roadmapping'] },
];

const teams: Team[] = [
  { id: 'team-1', name: 'Alpha Coders', leadId: 'user-3', memberIds: ['user-3', 'user-4'], projectId: 'proj-1' },
  { id: 'team-2', name: 'Beta Builders', leadId: 'user-1', memberIds: ['user-5', 'user-6'], projectId: 'proj-2' }
];

const projects: Project[] = [
  { id: 'proj-1', name: 'Phoenix Project', ownerId: 'user-7', startDate: '2023-01-01', endDate: '2023-12-31', description: 'A major overhaul of the internal CRM system.', memberIds: ['user-3', 'user-4', 'user-7'], status: 'In Progress' as ProjectStatus },
  { id: 'proj-2', name: 'Quantum Leap Initiative', ownerId: 'user-7', startDate: '2023-03-01', endDate: '2024-06-30', description: 'Developing a next-generation data analytics platform.', memberIds: ['user-5', 'user-6', 'user-7'], status: 'Completed' as ProjectStatus }
];

const epics: Epic[] = [
  { id: 'epic-1', name: 'User Authentication Module', projectId: 'proj-1' },
  { id: 'epic-2', name: 'Dashboard & Reporting', projectId: 'proj-1' },
  { id: 'epic-3', name: 'Data Ingestion Pipeline', projectId: 'proj-2' }
];

const sprints: Sprint[] = [
  { id: 'sprint-1', name: 'Sprint 1 (Phoenix)', projectId: 'proj-1', startDate: '2023-01-01', endDate: '2023-01-14' },
  { id: 'sprint-2', name: 'Sprint 2 (Phoenix)', projectId: 'proj-1', startDate: '2023-01-15', endDate: '2023-01-28' },
  { id: 'sprint-3', name: 'Sprint 1 (Quantum)', projectId: 'proj-2', startDate: '2023-03-01', endDate: '2023-03-14' }
];

const stories: Story[] = [
  { id: 'story-1', number: 'STRY-1001', shortDescription: 'Implement JWT-based login', description: 'Users should be able to log in using their credentials and receive a JWT.', acceptanceCriteria: '1. User enters valid credentials.\n2. API returns a valid JWT.\n3. User is redirected to dashboard.', state: StoryState.Done, priority: StoryPriority.Critical, type: StoryType.Feature, assignedTeamId: 'team-1', assignedToId: 'user-4', storyPoints: 5, sprintId: 'sprint-1', epicId: 'epic-1', projectId: 'proj-1', createdById: 'user-3', updatedById: 'user-4', createdOn: '2023-01-05T10:00:00Z', updatedOn: '2023-01-10T15:30:00Z', progress: 100, businessOwnerId: 'user-1', testedById: 'user-3' },
  { id: 'story-2', number: 'STRY-1002', shortDescription: 'Create user dashboard page', description: 'A dashboard page showing key metrics for the logged-in user.', state: StoryState.InProgress, priority: StoryPriority.High, type: StoryType.Feature, assignedTeamId: 'team-1', assignedToId: 'user-4', storyPoints: 8, sprintId: 'sprint-2', epicId: 'epic-2', projectId: 'proj-1', createdById: 'user-3', updatedById: 'user-3', createdOn: '2023-01-16T09:00:00Z', updatedOn: '2023-01-20T11:00:00Z', progress: 50 },
  { id: 'story-3', number: 'STRY-1003', shortDescription: 'Setup Kafka cluster for data ingestion', description: 'Deploy and configure a Kafka cluster to handle incoming data streams.', state: StoryState.Ready, priority: StoryPriority.Moderate, type: StoryType.Enhancement, assignedTeamId: 'team-2', assignedToId: 'user-5', storyPoints: 13, sprintId: 'sprint-3', epicId: 'epic-3', projectId: 'proj-2', createdById: 'user-1', updatedById: 'user-1', createdOn: '2023-03-02T14:00:00Z', updatedOn: '2023-03-02T14:00:00Z', progress: 10 },
  { id: 'story-4', number: 'STRY-1004', shortDescription: 'Design data visualization components', description: 'Create reusable React components for charts and graphs.', state: StoryState.Draft, priority: StoryPriority.High, type: StoryType.Feature, assignedTeamId: 'team-2', assignedToId: 'user-6', storyPoints: 8, sprintId: 'sprint-3', epicId: 'epic-3', projectId: 'proj-2', createdById: 'user-1', updatedById: 'user-1', createdOn: '2023-03-03T16:00:00Z', updatedOn: '2023-03-03T16:00:00Z', progress: 0 }
];

const storyChats: StoryChat = {
  'story-1': [
    { id: 'sc-1-1', authorId: 'user-3', timestamp: '2023-01-06T11:00:00Z', text: 'Hey Emma, how is the login implementation going?' },
    { id: 'sc-1-2', authorId: 'user-4', timestamp: '2023-01-06T11:05:00Z', text: 'Going well! Should have a PR ready by EOD.' }
  ],
  'story-2': [
    { id: 'sc-2-1', authorId: 'user-1', timestamp: '2023-01-18T10:00:00Z', text: 'Remember to use the new branding guidelines for the dashboard.' }
  ]
};

const projectChats: ProjectChat = {
  'proj-1': [
    { id: 'pc-1-1', authorId: 'user-1', timestamp: '2023-01-02T09:00:00Z', text: 'Welcome to the Phoenix Project team! Let\'s make this a success.' },
    { id: 'pc-1-2', authorId: 'user-3', timestamp: '2023-01-02T09:05:00Z', text: 'Excited to be on board!' }
  ]
};

const notifications: Notification[] = [];

export const seedData = {
  users,
  teams,
  projects,
  stories,
  epics,
  sprints,
  storyChats,
  projectChats,
  notifications,
};