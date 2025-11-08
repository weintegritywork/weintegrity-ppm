

import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import { AuthContext } from '../context/AuthContext';
import Card from '../components/Card';
import Table from '../components/Table';
import { User, Role } from '../types';
import PageHeader from '../components/PageHeader';

const Employees: React.FC = () => {
  const dataContext = useContext(DataContext);
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');

  if (!dataContext || !authContext) return <div>Loading...</div>;

  const { users, teams } = dataContext;
  const { hasPermission } = authContext;

  const getTeamName = (teamId?: string) => {
    if (!teamId) return 'N/A';
    return teams.find(t => t.id === teamId)?.name || 'N/A';
  };
  
  const filteredUsers = users.filter(u =>
    u.firstName.toLowerCase().includes(filter.toLowerCase()) ||
    u.lastName.toLowerCase().includes(filter.toLowerCase()) ||
    u.employeeId.toLowerCase().includes(filter.toLowerCase())
  );
  
  const columns = [
    { key: 'employeeId', header: 'Employee ID' },
    { key: 'name', header: 'Name', render: (user: User) => `${user.firstName} ${user.lastName}` },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    { key: 'team', header: 'Team', render: (user: User) => getTeamName(user.teamId) },
    { key: 'jobTitle', header: 'Job Title' },
  ];

  return (
    <>
      <PageHeader
        title="Employees"
        showBackButton={false}
        actions={
          hasPermission([Role.Admin, Role.HR]) && (
            <button
              onClick={() => navigate('/register')}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
            >
              + Add Employee
            </button>
          )
        }
      />
      <Card>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full md:w-1/3 p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <Table<User>
          columns={columns}
          data={filteredUsers}
          rowKey="id"
          onRowClick={(user) => navigate(`/profile/${user.id}`)}
        />
      </Card>
    </>
  );
};

export default Employees;
