export enum Role {
  Admin = 'Admin',
  HR = 'HR',
  TeamLead = 'TeamLead',
  Employee = 'Employee',
  ProductOwner = 'ProductOwner',
}

export enum WorkLocation {
  Remote = 'Remote',
  WFH = 'Work From Home',
  WFO = 'Work From Office',
}

export interface User {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  department: string;
  jobTitle: string;
  dateOfJoining: string;
  password?: string;
  address?: string;
  emergencyContact?: string;
  linkedin?: string;
  notes?: string;
  teamId?: string;
  projectId?: string;
  status: 'active' | 'inactive';
  // New fields
  skills?: string[];
  experience?: number; // years of experience
  nativeLocation?: string;
  workLocation?: WorkLocation;
  avatar?: string; // Base64 image data or URL
  bio?: string; // Short bio/description
}

export interface Team {
  id: string;
  name: string;
  leadId: string;
  memberIds: string[];
  projectId?: string;
}

export enum ProjectStatus {
  NotStarted = 'Not Started',
  InProgress = 'In Progress',
  OnHold = 'On Hold',
  Completed = 'Completed',
}

export interface Project {
  id: string;
  name: string;
  ownerId?: string;
  startDate: string;
  endDate: string;
  description: string;
  memberIds: string[];
  status: ProjectStatus;
}

export enum StoryState {
  Draft = 'Draft',
  Ready = 'Ready',
  InProgress = 'In Progress',
  Test = 'Test',
  Done = 'Done',
  Blocked = 'Blocked',
}

export enum StoryPriority {
  Critical = '1 - Critical',
  High = '2 - High',
  Moderate = '3 - Moderate',
  Low = '4 - Low',
}

export enum StoryType {
    Feature = 'Feature',
    Defect = 'Defect',
    Enhancement = 'Enhancement',
}


export interface Story {
  id: string; // Sys ID
  number: string;
  shortDescription: string;
  description: string;
  acceptanceCriteria?: string;
  state: StoryState;
  priority: StoryPriority;
  type: StoryType;
  storyPoints?: number;

  assignedTeamId?: string;
  assignedToId?: string;
  businessOwnerId?: string;
  testedById?: string;

  projectId: string;
  epicId?: string;
  sprintId?: string;
  release?: string;

  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  progress?: number; // 0-100
  deadline?: string;

  workNotes?: string;
  attachments?: { name: string; url: string }[];
  relatedStoryIds?: string[];
  
  createdById: string;
  createdOn: string;
  updatedById: string;
  updatedOn: string;
}

export interface Epic {
  id: string;
  name: string;
  projectId: string;
}

export interface Sprint {
  id: string;
  name: string;
  projectId: string;
  startDate: string;
  endDate: string;
}

export interface ChatMessage {
  id: string;
  authorId: string;
  timestamp: string;
  text: string;
  attachment?: { name:string; url: string };
}

export interface StoryChat {
  [storyId: string]: ChatMessage[];
}

export interface ProjectChat {
  [projectId: string]: ChatMessage[];
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  link: string;
  isRead: boolean;
  timestamp: string;
}