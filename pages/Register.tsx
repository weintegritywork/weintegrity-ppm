
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import { ToastContext } from '../context/ToastContext';
import { User, Role } from '../types';
import { api } from '../utils/api';
import Card from '../components/Card';
import FormField from '../components/FormField';
import { isEmailUnique } from '../utils/validators';
import PageHeader from '../components/PageHeader';
import SelectDropdown from '../components/SelectDropdown';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const toastContext = useContext(ToastContext);

  const [formData, setFormData] = useState<Omit<User, 'id' | 'employeeId'>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: Role.Employee,
    department: '',
    jobTitle: '',
    dateOfJoining: '',
    status: 'active',
    password: 'password123',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!dataContext || !toastContext) return null;
  const { users, addUser } = dataContext;
  
  const generateEmployeeId = (allUsers: User[]): string => {
    // Start from 1001 if no numeric IDs exist
    const startingId = 1000; 
    const numericIds = allUsers
        .map(u => parseInt(u.employeeId, 10))
        .filter(id => !isNaN(id));
    
    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : startingId;
    return (maxId + 1).toString();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!isEmailUnique(formData.email, users)) newErrors.email = 'Email already exists';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    if (!formData.dateOfJoining) newErrors.dateOfJoining = 'Date of joining is required';
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }
    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.jobTitle) newErrors.jobTitle = 'Job title is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value as Role }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toastContext.addToast('Please correct the errors in the form.', 'error');
      return;
    }

    try {
      const newEmployeeId = generateEmployeeId(users);
      const newUser: User = {
        ...formData,
        id: `user-${Date.now()}`,
        employeeId: newEmployeeId,
        password: formData.password,
      };

      const result = await api.register(newUser);
      
      if (result.error) {
        toastContext.addToast(result.error, 'error');
        return;
      }

      // Refresh users list from backend
      if (dataContext?.refreshData) {
        await dataContext.refreshData();
      }
      
      toastContext.addToast(`Employee registered! ID: ${newEmployeeId}.`, 'success');
      navigate('/employees');
    } catch (error) {
      toastContext.addToast('Failed to register employee. Please try again.', 'error');
    }
  };

  const roleOptions = Object.values(Role)
    .filter(role => role !== Role.TeamLead)
    .map(role => ({ value: role, label: role }));

  return (
    <>
      <PageHeader title="Register New Employee" showBackButton />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField id="firstName" label="First Name" value={formData.firstName} onChange={handleChange} required error={errors.firstName} />
            <FormField id="lastName" label="Last Name" value={formData.lastName} onChange={handleChange} required error={errors.lastName} />
            <FormField id="email" label="Email" type="email" value={formData.email} onChange={handleChange} required error={errors.email} />
            <FormField id="phone" label="Phone" value={formData.phone} onChange={handleChange} required error={errors.phone} />
            <FormField id="dateOfJoining" label="Date of Joining" type="date" value={formData.dateOfJoining} onChange={handleChange} required error={errors.dateOfJoining} />
            <FormField id="password" label="Password" type="password" value={formData.password || ''} onChange={handleChange} required error={errors.password} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <SelectDropdown
                value={formData.role}
                onChange={handleRoleChange}
                options={roleOptions}
              />
              {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
            </div>
            <FormField id="department" label="Department" value={formData.department} onChange={handleChange} required error={errors.department} />
            <FormField id="jobTitle" label="Job Title" value={formData.jobTitle} onChange={handleChange} required error={errors.jobTitle} />
          </div>
          <div className="flex justify-end gap-2">
              <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Register</button>
          </div>
        </form>
      </Card>
    </>
  );
};

export default Register;
