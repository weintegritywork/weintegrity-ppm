import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { DataContext } from '../context/DataContext';
import { Role, Story, StoryState, Team, User, Project } from '../types';
import Card from '../components/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Link } from 'react-router-dom';
import ProductOwnerDashboard from './ProductOwnerDashboard';
import PageHeader from '../components/PageHeader';

// Color mapping for story states
const STATE_COLORS: Record<StoryState, string> = {
    [StoryState.Draft]: '#9CA3AF',      // Gray
    [StoryState.Ready]: '#6B7280',      // Dark Gray
    [StoryState.InProgress]: '#F59E0B', // Amber/Yellow
    [StoryState.Test]: '#3B82F6',       // Blue
    [StoryState.Done]: '#10B981',       // Green
    [StoryState.Blocked]: '#EF4444',    // Red
};

const AdminDashboard: React.FC = () => {
    const dataContext = useContext(DataContext);
    if (!dataContext) return null;

    const { projects, stories } = dataContext;

    const projectProgress = projects.map(p => {
        const projectStories = stories.filter(s => s.projectId === p.id);
        const completed = projectStories.filter(s => s.state === StoryState.Done).length;
        const total = projectStories.length;
        
        const progressData = {
            name: p.name,
            completed,
            pending: total - completed,
            total,
            progress: total > 0 ? (completed / total) * 100 : 0
        };
        
        console.log('Project Progress Data:', progressData);
        
        return progressData;
    });
    
    console.log('All Project Progress:', projectProgress);

    const storyStatusDistribution = Object.values(StoryState).map(state => ({
        name: state,
        value: stories.filter(s => s.state === state).length
    }));

    const stats = [
      { title: 'Total Projects', value: projects.length, link: '/projects', color: 'from-indigo-500 to-indigo-600', icon: '📊' },
      { title: 'Ready Stories', value: stories.filter(s => s.state === StoryState.Ready).length, link: '/stories', filter: StoryState.Ready, color: 'from-gray-500 to-gray-600', icon: '📋' },
      { title: 'In Progress', value: stories.filter(s => s.state === StoryState.InProgress).length, link: '/stories', filter: StoryState.InProgress, color: 'from-yellow-500 to-yellow-600', icon: '⏳' },
      { title: 'In Test', value: stories.filter(s => s.state === StoryState.Test).length, link: '/stories', filter: StoryState.Test, color: 'from-blue-500 to-blue-600', icon: '🧪' },
      { title: 'Done Stories', value: stories.filter(s => s.state === StoryState.Done).length, link: '/stories', filter: StoryState.Done, color: 'from-green-500 to-green-600', icon: '✅' },
    ];


    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {stats.map(stat => (
                    <Link
                        key={stat.title}
                        to={stat.link}
                        state={stat.filter ? { prefilter: stat.filter } : undefined}
                        className={`block p-6 rounded-xl shadow-md text-white bg-gradient-to-br ${stat.color} transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                    >
                        <div className="text-4xl mb-2">{stat.icon}</div>
                        <div className="text-4xl font-bold">{stat.value}</div>
                        <div className="text-xs font-medium opacity-90 mt-2 uppercase tracking-wide">{stat.title}</div>
                    </Link>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Project Progress Overview" className="lg:col-span-2">
                    {projectProgress.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={projectProgress} layout="horizontal" margin={{ left: 20, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis type="number" domain={[0, 'dataMax']} allowDecimals={false} />
                                    <YAxis dataKey="name" type="category" width={150} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                        formatter={(value: any, name: string) => [value, name === 'completed' ? 'Completed' : 'Pending']}
                                    />
                                    <Legend />
                                    <Bar dataKey="completed" stackId="a" fill="url(#completedGradient)" name="Completed" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="pending" stackId="a" fill="#e5e7eb" name="Pending" radius={[0, 4, 4, 0]} />
                                    <defs>
                                        <linearGradient id="completedGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#3b82f6" />
                                            <stop offset="100%" stopColor="#60a5fa" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                            <p className="text-xs text-gray-500 text-center mt-3 italic">
                                Progress is calculated based on stories assigned to each project
                            </p>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <div className="text-6xl mb-4">📊</div>
                            <p className="text-lg font-medium">No projects yet</p>
                            <p className="text-sm">Create your first project to see progress here</p>
                        </div>
                    )}
                </Card>
                <Card title="Story Status Distribution">
                    {stories.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie 
                                        data={storyStatusDistribution.filter(d => d.value > 0)} 
                                        cx="50%" 
                                        cy="50%" 
                                        labelLine={false} 
                                        innerRadius={60}
                                        outerRadius={90} 
                                        fill="#8884d8" 
                                        dataKey="value" 
                                        nameKey="name"
                                        label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                                    >
                                        {storyStatusDistribution.filter(d => d.value > 0).map((entry) => (
                                            <Cell key={`cell-${entry.name}`} fill={STATE_COLORS[entry.name as StoryState]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-gray-700">
                                        {stories.length}
                                    </text>
                                    <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="text-xs fill-gray-500">
                                        Total Stories
                                    </text>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                                {storyStatusDistribution.filter(d => d.value > 0).map((entry) => (
                                    <div key={entry.name} className="flex items-center gap-2">
                                        <div 
                                            className="w-3 h-3 rounded-sm flex-shrink-0" 
                                            style={{ backgroundColor: STATE_COLORS[entry.name as StoryState] }}
                                        />
                                        <span className="text-gray-700">{entry.name} ({entry.value})</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <div className="text-6xl mb-4">📝</div>
                            <p className="text-lg font-medium">No stories yet</p>
                            <p className="text-sm">Create your first story to see distribution</p>
                        </div>
                    )}
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
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-shadow">
                        <div className="text-3xl mb-2">📊</div>
                        <p className="text-4xl font-bold text-blue-600">{myStories.length}</p>
                        <p className="text-xs font-medium text-gray-600 mt-2 uppercase tracking-wide">Total Assigned</p>
                    </div>
                     <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl hover:shadow-md transition-shadow">
                        <div className="text-3xl mb-2">⏳</div>
                        <p className="text-4xl font-bold text-yellow-600">{myStories.filter(s => s.state === StoryState.InProgress).length}</p>
                        <p className="text-xs font-medium text-gray-600 mt-2 uppercase tracking-wide">In Progress</p>
                    </div>
                     <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-md transition-shadow">
                        <div className="text-3xl mb-2">✅</div>
                        <p className="text-4xl font-bold text-green-600">{myStories.filter(s => s.state === StoryState.Done).length}</p>
                        <p className="text-xs font-medium text-gray-600 mt-2 uppercase tracking-wide">Completed</p>
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
                 {myStories.length > 0 ? (
                     <>
                         <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie 
                                    data={storyStatusDistribution} 
                                    cx="50%" 
                                    cy="50%" 
                                    labelLine={false} 
                                    innerRadius={50} 
                                    outerRadius={70} 
                                    fill="#8884d8" 
                                    dataKey="value" 
                                    nameKey="name" 
                                    label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                                >
                                    {storyStatusDistribution.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={STATE_COLORS[entry.name as StoryState]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-xl font-bold fill-gray-700">
                                    {myStories.length}
                                </text>
                                <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="text-xs fill-gray-500">
                                    Stories
                                </text>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            {storyStatusDistribution.map((entry) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div 
                                        className="w-3 h-3 rounded-sm flex-shrink-0" 
                                        style={{ backgroundColor: STATE_COLORS[entry.name as StoryState] }}
                                    />
                                    <span className="text-gray-700">{entry.name} ({entry.value})</span>
                                </div>
                            ))}
                        </div>
                     </>
                 ) : (
                     <div className="flex flex-col items-center justify-center h-56 text-gray-400">
                         <div className="text-5xl mb-3">📝</div>
                         <p className="text-base font-medium">No stories assigned</p>
                     </div>
                 )}
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
      <PageHeader title={`Welcome, ${currentUser?.firstName}!`} showBackButton={false} showDateTime={true} />
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;