import React, { useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { DataContext } from '../context/DataContext';
import { Story, StoryState } from '../types';
import Card from '../components/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';

// Color mapping for story states
const STATE_COLORS: Record<StoryState, string> = {
    [StoryState.Draft]: '#9CA3AF',      // Gray
    [StoryState.Ready]: '#6B7280',      // Dark Gray
    [StoryState.InProgress]: '#F59E0B', // Amber/Yellow
    [StoryState.Test]: '#3B82F6',       // Blue
    [StoryState.Done]: '#10B981',       // Green
    [StoryState.Blocked]: '#EF4444',    // Red
};

const ProductOwnerDashboard: React.FC = () => {
    const dataContext = useContext(DataContext);
    const authContext = useContext(AuthContext);

    if (!dataContext || !authContext) return null;

    const { projects, stories } = dataContext;
    const { currentUser } = authContext;

    const myProjects = useMemo(() => {
        return projects.filter(p => p.ownerId === currentUser?.id);
    }, [projects, currentUser]);

    const myProjectIds = useMemo(() => myProjects.map(p => p.id), [myProjects]);
    
    const myStories = useMemo(() => {
        return stories.filter(s => myProjectIds.includes(s.projectId));
    }, [stories, myProjectIds]);

    const projectProgress = myProjects.map(p => {
        const projectStories = myStories.filter(s => s.projectId === p.id);
        const completed = projectStories.filter(s => s.state === StoryState.Done).length;
        const total = projectStories.length;
        return {
            name: p.name,
            progress: total > 0 ? (completed / total) * 100 : 0
        };
    });

    const storyStatusDistribution = Object.values(StoryState).map(state => ({
        name: state,
        value: myStories.filter(s => s.state === state).length
    })).filter(item => item.value > 0);

    const stats = [
        { title: 'Owned Projects', value: myProjects.length, color: 'bg-indigo-500' },
        { title: 'Total Stories', value: myStories.length, color: 'bg-blue-500' },
        { title: 'Stories In Progress', value: myStories.filter(s => s.state === StoryState.InProgress).length, color: 'bg-yellow-500' },
        { title: 'Stories Completed', value: myStories.filter(s => s.state === StoryState.Done).length, color: 'bg-green-500' },
    ];

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map(stat => (
                    <div key={stat.title} className={`p-4 rounded-xl shadow-md text-white ${stat.color}`}>
                        <div className="text-3xl font-bold">{stat.value}</div>
                        <div className="text-sm font-medium opacity-90 mt-1">{stat.title}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="My Projects Overview" className="lg:col-span-2">
                    <ul className="space-y-4">
                        {projectProgress.map(p => (
                            <li key={p.name}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-gray-700">{p.name}</span>
                                    <span className="text-sm font-bold text-gray-600">{p.progress.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${p.progress}%` }}></div>
                                </div>
                            </li>
                        ))}
                         {projectProgress.length === 0 && <p className="text-center text-gray-500 py-4">You do not own any projects.</p>}
                    </ul>
                    {projectProgress.length > 0 && (
                        <p className="text-xs text-gray-500 text-center mt-4 italic">
                            Progress is calculated based on stories assigned to each project
                        </p>
                    )}
                </Card>
                 <Card title="Story Status Distribution">
                    {storyStatusDistribution.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={storyStatusDistribution} cx="50%" cy="50%" labelLine={false} outerRadius={70} fill="#8884d8" dataKey="value" nameKey="name" label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                                        {storyStatusDistribution.map((entry) => <Cell key={`cell-${entry.name}`} fill={STATE_COLORS[entry.name as StoryState]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
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
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <div className="text-5xl mb-3">📝</div>
                            <p className="text-base font-medium">No stories yet</p>
                        </div>
                    )}
                </Card>
            </div>
             <Card title="Quick Access">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">My Projects</h3>
                        <ul className="space-y-2">
                            {myProjects.map(p => (
                                <li key={p.id}>
                                    <Link to={`/projects/${p.id}`} className="text-blue-600 hover:underline hover:font-semibold">
                                        {p.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                     <div>
                        <h3 className="font-semibold text-gray-700 mb-2">My Recent Stories (In Progress)</h3>
                         <ul className="space-y-2">
                            {myStories.filter(s => s.state === StoryState.InProgress).slice(0,5).map(s => (
                                <li key={s.id}>
                                    <Link to={`/stories/${s.id}`} className="text-blue-600 hover:underline">
                                        {s.number}: {s.shortDescription}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ProductOwnerDashboard;