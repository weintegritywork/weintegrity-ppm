import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { DataContext } from '../context/DataContext';
import { Role, Story, StoryState, Team, User, Project } from '../types';
import Card from '../components/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Link } from 'react-router-dom';
import ProductOwnerDashboard from './ProductOwnerDashboard';
import PageHeader from '../components/PageHeader';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#a4de6c'];

const AdminDashboard: React.FC = () => {
    const dataContext = useContext(DataContext);
    if (!dataContext) return null;

    const { projects, stories } = dataContext;

    const projectProgress = projects.map(p => {
        const projectStories = stories.filter(s => s.projectId === p.id);
        const completed = projectStories.filter(s => s.state === StoryState.Done).length;
        const total = projectStories.length;
        return {
            name: p.name,
            completed,
            pending: total - completed,
            total,
            progress: total > 0 ? (completed / total) * 100 : 0
        };
    });

    const storyStatusDistribution = Object.values(StoryState).map(state => ({
        name: state,
        value: stories.filter(s => s.state === state).length
    }));

    const stats = [
      { title: 'Total Projects', value: projects.length, link: '/projects', color: 'bg-indigo-500' },
      { title: 'Ready Stories', value: stories.filter(s => s.state === StoryState.Ready).length, link: '/stories', filter: StoryState.Ready, color: 'bg-gray-500' },
      { title: 'In Progress', value: stories.filter(s => s.state === StoryState.InProgress).length, link: '/stories', filter: StoryState.InProgress, color: 'bg-yellow-500' },
      { title: 'In Test', value: stories.filter(s => s.state === StoryState.Test).length, link: '/stories', filter: StoryState.Test, color: 'bg-blue-500' },
      { title: 'Done Stories', value: stories.filter(s => s.state === StoryState.Done).length, link: '/stories', filter: StoryState.Done, color: 'bg-green-500' },
    ];


    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {stats.map(stat => (
                    <Link
                        key={stat.title}
                        to={stat.link}
                        state={stat.filter ? { prefilter: stat.filter } : undefined}
                        className={`block p-4 rounded-xl shadow-md text-white ${stat.color} transition-transform duration-200 hover:scale-105 hover:shadow-lg`}
                    >
                        <div className="text-3xl font-bold">{stat.value}</div>
                        <div className="text-sm font-medium opacity-90 mt-1">{stat.title}</div>
                    </Link>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Project Progress Overview" className="lg:col-span-2">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={projectProgress}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="completed" stackId="a" fill="#3b82f6" name="Completed" />
                            <Bar dataKey="pending" stackId="a" fill="#e5e7eb" name="Pending" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
                <Card title="Story Status Distribution">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={storyStatusDistribution} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {storyStatusDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>
        </>
    );
};

const getProjectProgress = (project: Project | undefined, stories: Story[]) => {
    if (!project) return { name: 'N/A', progress: 0 };
    const projectStories = stories.filter(s => s.projectId === project.id);
    const completed = projectStories.filter(s => s.state === StoryState.Done).length;
    const total = projectStories.length;
    return {
        name: project.name,
        progress: total > 0 ? (completed / total) * 100 : 0
    };
};


const TeamLeadDashboard: React.FC = () => {
    const dataContext = useContext(DataContext);
    const authContext = useContext(AuthContext);
    if (!dataContext || !authContext) return null;

    const { stories, users, teams, projects } = dataContext;
    const { currentUser } = authContext;

    const myTeam = teams.find(t => t.leadId === currentUser?.id);
    const teamStories = stories.filter(s => s.assignedTeamId === myTeam?.id);
    const teamMembers = users.filter(u => myTeam?.memberIds.includes(u.id));
    const project = projects.find(p => p.id === myTeam?.projectId);
    const projectProgress = getProjectProgress(project, stories);

    const storiesByState = Object.values(StoryState).map(state => ({
        name: state,
        count: teamStories.filter(s => s.state === state).length
    }));
    
    const workloadData = teamMembers.map(member => ({
        name: member.firstName,
        stories: teamStories.filter(s => s.assignedToId === member.id && s.state !== StoryState.Done).length,
    }));


    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title={`Project: ${projectProgress.name}`}>
                <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className="bg-green-600 h-4 rounded-full text-center text-white text-xs font-bold" style={{ width: `${projectProgress.progress}%` }}>
                        {projectProgress.progress.toFixed(0)}%
                    </div>
                </div>
            </Card>
            <Card title="Team Stories by State">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={storiesByState}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" name="Story Count" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
             <Card title="Team Member Workload (Active Stories)">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={workloadData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="stories" fill="#8884d8" name="Assigned Stories" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
            <Card title="My Team Members">
                <ul className="space-y-3">
                    {teamMembers.map(member => {
                         const assignedStories = teamStories.filter(s => s.assignedToId === member.id);
                         const completed = assignedStories.filter(s => s.state === StoryState.Done).length;
                         return (
                            <li key={member.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                                {currentUser?.role === Role.Admin || currentUser?.role === Role.HR ? (
                                    <Link to={`/profile/${member.id}`} className="text-blue-600 hover:underline">{member.firstName} {member.lastName}</Link>
                                ) : (
                                    <span className="font-medium text-gray-800">{member.firstName} {member.lastName}</span>
                                )}
                                <span className="text-sm font-medium text-gray-600">{completed}/{assignedStories.length} stories done</span>
                            </li>
                         );
                    })}
                </ul>
            </Card>
        </div>
    );
};

const EmployeeDashboard: React.FC = () => {
    const dataContext = useContext(DataContext);
    const authContext = useContext(AuthContext);
    if (!dataContext || !authContext) return null;

    const { stories, projects, users, teams } = dataContext;
    const { currentUser } = authContext;

    const myStories = stories.filter(s => s.assignedToId === currentUser?.id);
    const project = projects.find(p => p.id === currentUser?.projectId);
    const projectProgress = getProjectProgress(project, stories);

    const myTeam = teams.find(t => t.id === currentUser?.teamId);
    const teamMembers = myTeam ? users.filter(u => myTeam.memberIds.includes(u.id)) : [];
    const teamLead = myTeam ? users.find(u => u.id === myTeam.leadId) : null;

    const storyStatusDistribution = Object.values(StoryState)
        .map(state => ({
            name: state,
            value: myStories.filter(s => s.state === state).length,
        }))
        .filter(item => item.value > 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="My Stories Overview" className="md:col-span-2">
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-3xl font-bold text-blue-600">{myStories.length}</p>
                        <p className="text-sm font-medium text-gray-600">Total Assigned</p>
                    </div>
                     <div className="p-4 bg-yellow-50 rounded-lg">
                        <p className="text-3xl font-bold text-yellow-600">{myStories.filter(s => s.state === StoryState.InProgress).length}</p>
                        <p className="text-sm font-medium text-gray-600">In Progress</p>
                    </div>
                     <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-3xl font-bold text-green-600">{myStories.filter(s => s.state === StoryState.Done).length}</p>
                        <p className="text-sm font-medium text-gray-600">Completed</p>
                    </div>
                </div>
            </Card>
            <Card title={`Project Progress: ${projectProgress.name}`}>
                <div className="w-full bg-gray-200 rounded-full h-6">
                    <div className="bg-green-600 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ width: `${projectProgress.progress}%` }}>
                        {projectProgress.progress.toFixed(0)}%
                    </div>
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">Overall progress of your assigned project.</p>
            </Card>
             <Card title="My Story Statuses">
                 <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie data={storyStatusDistribution} cx="50%" cy="50%" labelLine={false} innerRadius={50} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {storyStatusDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </Card>
            <Card title="My Team" className="md:col-span-2">
                {myTeam ? (
                    <div>
                        <div className="flex justify-between items-baseline mb-4">
                            <h3 className="text-xl font-bold text-gray-800">
                                <Link to={`/teams/${myTeam.id}`} className="hover:underline">{myTeam.name}</Link>
                            </h3>
                            {teamLead && (
                                <p className="text-sm text-gray-600">
                                    Lead by: {currentUser?.role === Role.Admin || currentUser?.role === Role.HR ? (
                                        <Link to={`/profile/${teamLead.id}`} className="font-medium text-blue-600 hover:underline">{teamLead.firstName} {teamLead.lastName}</Link>
                                    ) : (
                                        <span className="font-medium text-gray-800">{teamLead.firstName} {teamLead.lastName}</span>
                                    )}
                                </p>
                            )}
                        </div>
                        <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {teamMembers.map(member => (
                                <li key={member.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                                        {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                                    </div>
                                    <div>
                                        {currentUser?.role === Role.Admin || currentUser?.role === Role.HR ? (
                                            <Link to={`/profile/${member.id}`} className="font-medium text-gray-800 hover:text-blue-600">{member.firstName} {member.lastName}</Link>
                                        ) : (
                                            <span className="font-medium text-gray-800">{member.firstName} {member.lastName}</span>
                                        )}
                                        <p className="text-xs text-gray-500">{member.jobTitle}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">You are not currently assigned to a team.</p>
                )}
            </Card>
            <Card title="My Active Stories" className="md:col-span-2">
                <ul className="space-y-2 max-h-80 overflow-y-auto">
                    {myStories.filter(s => s.state !== StoryState.Done).map(story => (
                        <li key={story.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                            <Link to={`/stories/${story.id}`} className="flex justify-between items-center">
                                <div>
                                    <span className="font-medium text-blue-600">{story.number}</span>
                                    <p className="text-gray-800">{story.shortDescription}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${story.state === StoryState.Done ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {story.state}
                                </span>
                            </Link>
                        </li>
                    ))}
                     {myStories.filter(s => s.state !== StoryState.Done).length === 0 && <p className="text-gray-500 text-center py-4">No active stories assigned. Great job!</p>}
                </ul>
            </Card>
        </div>
    );
};

const Dashboard: React.FC = () => {
  const authContext = useContext(AuthContext);
  const { currentUser } = authContext!;

  const renderDashboard = () => {
    switch (currentUser?.role) {
      case Role.Admin:
        return <AdminDashboard />;
      case Role.HR:
        return <AdminDashboard />; // HR has similar overview
      case Role.TeamLead:
        return <TeamLeadDashboard />;
      case Role.Employee:
        return <EmployeeDashboard />;
      case Role.ProductOwner:
        return <ProductOwnerDashboard />;
      default:
        return <div>Welcome!</div>;
    }
  };

  return (
    <div>
      <PageHeader title={`Welcome, ${currentUser?.firstName}!`} showBackButton={false} />
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;