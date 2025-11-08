

import React, { useContext, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import Card from '../components/Card';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { Story, StoryState, Role, User } from '../types';
import { isEmailUnique } from '../utils/validators';
import PageHeader from '../components/PageHeader';


const ToggleSwitch: React.FC<{ label: string; isChecked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; }> = ({ label, isChecked, onChange, disabled = false }) => (
    <div className="flex items-center justify-between py-2">
        <span className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}</span>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={isChecked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" disabled={disabled} />
            <div className={`w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${disabled ? 'cursor-not-allowed opacity-50' : ''} peer-checked:bg-blue-600`}></div>
        </label>
    </div>
);

const Profile: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const dataContext = useContext(DataContext);
  const authContext = useContext(AuthContext);
  const toastContext = useContext(ToastContext);
  const navigate = useNavigate();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (!dataContext || !authContext || !toastContext) return <div>Loading...</div>;

  const { users, teams, projects, stories, updateUser, deleteUser } = dataContext;
  const { currentUser } = authContext;
  const user = users.find(u => u.id === employeeId);
  
  const canViewProfile = currentUser?.role === Role.Admin || currentUser?.role === Role.HR || currentUser?.id === employeeId;

  if (!user) return <div>User not found.</div>;
  
  if (!canViewProfile) {
    return (
        <>
            <PageHeader title="Access Denied" showBackButton />
            <Card>
                <div className="text-center p-8">
                    <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                    <p className="text-gray-600 mt-2">You do not have permission to view this profile.</p>
                </div>
            </Card>
        </>
    );
  }

  const team = teams.find(t => t.id === user.teamId);
  const project = projects.find(p => p.id === user.projectId);
  const assignedStories = stories.filter(s => s.assignedToId === user.id);

  const canViewSensitiveInfo = currentUser?.role === Role.Admin || currentUser?.role === Role.HR || currentUser?.id === user.id;

  const handlePasswordUpdate = async () => {
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    
    try {
      await updateUser(user.id, { password: newPassword });
      toastContext.addToast("Password updated successfully!", 'success');
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    } catch (error) {
      toastContext.addToast('Failed to update password. Please try again.', 'error');
    }
  };

  const handleStatusToggle = async (isChecked: boolean) => {
    const newStatus = isChecked ? 'active' : 'inactive';
    try {
      await updateUser(user.id, { status: newStatus });
      toastContext.addToast(`${user.firstName}'s account is now ${newStatus}.`, 'info');
    } catch (error) {
      toastContext.addToast('Failed to update status. Please try again.', 'error');
    }
  };

  const handleEditClick = () => {
    setEditingUser({ ...user });
    setErrors({});
    setIsEditModalOpen(true);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (editingUser) {
        setEditingUser({ ...editingUser, [e.target.id]: e.target.value });
    }
  };

  const validate = (): boolean => {
    if (!editingUser) return false;
    const newErrors: Record<string, string> = {};
    if (!editingUser.firstName) newErrors.firstName = 'First name is required';
    if (!editingUser.lastName) newErrors.lastName = 'Last name is required';
    if (!editingUser.email) newErrors.email = 'Email is required';
    else if (!isEmailUnique(editingUser.email, users, editingUser.id)) newErrors.email = 'Email already exists';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (editingUser && validate()) {
        try {
          await updateUser(user.id, editingUser);
          toastContext.addToast('Employee details updated successfully!', 'success');
          setIsEditModalOpen(false);
        } catch (error) {
          toastContext.addToast('Failed to update employee. Please try again.', 'error');
        }
    } else {
        toastContext.addToast('Please correct the errors in the form.', 'error');
    }
  };

  const handleDeleteEmployee = async () => {
    const isTeamLead = teams.some(t => t.leadId === user.id);
    const isProjectOwner = projects.some(p => p.ownerId === user.id);

    if (isTeamLead || isProjectOwner) {
        toastContext.addToast('Cannot delete user. They are a Team Lead or Project Owner. Please reassign their role first.', 'error');
        setIsDeleteModalOpen(false);
        return;
    }

    try {
      await deleteUser(user.id);
      toastContext.addToast('Employee has been permanently deleted.', 'success');
      navigate('/employees');
    } catch (error) {
      toastContext.addToast('Failed to delete employee. Please try again.', 'error');
    }
  };


  const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode }> = ({ label, value }) => (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || 'N/A'}</dd>
    </div>
  );

  return (
    <>
      <PageHeader title="Employee Profile" showBackButton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-blue-500 text-white flex items-center justify-center text-4xl font-bold mb-4">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
              <p className="text-gray-500">{user.jobTitle}</p>
              <span className={`mt-2 px-3 py-1 text-xs font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {user.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
             {currentUser?.role === Role.Admin && currentUser.id !== user.id && (
                <div className="mt-4 border-t pt-4 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-600 text-center">Admin Controls</h3>
                    <ToggleSwitch 
                        label="Account Active"
                        isChecked={user.status === 'active'}
                        onChange={handleStatusToggle}
                    />
                    <button onClick={() => setIsPasswordModalOpen(true)} className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                        Change Password
                    </button>
                </div>
            )}
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card title={
            <div className="flex justify-between items-center">
                <span>Employee Information</span>
                {currentUser?.role === Role.Admin && (
                    <button
                        onClick={handleEditClick}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                        Edit
                    </button>
                )}
            </div>
          }>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
              {canViewSensitiveInfo ? (
                <>
                  <DetailItem label="Employee ID" value={user.employeeId} />
                  <DetailItem label="Email" value={user.email} />
                  <DetailItem label="Phone" value={user.phone} />
                  <DetailItem label="Date of Joining" value={new Date(user.dateOfJoining).toLocaleDateString()} />
                </>
              ) : null}
              <DetailItem label="Department" value={user.department} />
              <DetailItem label="Role" value={user.role} />
              <DetailItem label="Assigned Team" value={team ? <Link to={`/teams/${team.id}`} className="text-blue-600 hover:underline">{team.name}</Link> : 'N/A'} />
              <DetailItem label="Assigned Project" value={project ? <Link to={`/projects/${project.id}`} className="text-blue-600 hover:underline">{project.name}</Link> : 'N/A'} />
            </dl>
          </Card>
          <Card title="Assigned Stories" className="mt-6">
            {assignedStories.length > 0 ? (
              <ul className="space-y-3">
                {assignedStories.map((story: Story) => (
                  <li key={story.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Link to={`/stories/${story.id}`} className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-blue-600">{story.number}</span>
                        <p className="text-sm text-gray-700">{story.shortDescription}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        story.state === StoryState.Done ? 'bg-green-100 text-green-800' : 
                        story.state === StoryState.InProgress ? 'bg-yellow-100 text-yellow-800' : 
                        story.state === StoryState.Test ? 'bg-blue-100 text-blue-800' :
                        story.state === StoryState.Blocked ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {story.state}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
                <p className="text-gray-500 text-center">No stories assigned.</p>
            )}
          </Card>
            {currentUser?.role === Role.Admin && currentUser.id !== user.id && (
                <Card title="Danger Zone" className="border-red-500 border-2 mt-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold text-gray-800">Delete Employee</h4>
                            <p className="text-sm text-gray-500">This action is permanent and cannot be undone.</p>
                        </div>
                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                        >
                            Delete
                        </button>
                    </div>
                </Card>
            )}
        </div>
      </div>
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
        size="sm"
      >
        <div className="space-y-4">
          <FormField
            id="newPassword"
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={passwordError}
          />
          <FormField
            id="confirmPassword"
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
          <button onClick={handlePasswordUpdate} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Update Password</button>
        </div>
      </Modal>

      {editingUser && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Employee Details" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField id="firstName" label="First Name" value={editingUser.firstName} onChange={handleFormChange} required error={errors.firstName} />
                <FormField id="lastName" label="Last Name" value={editingUser.lastName} onChange={handleFormChange} required error={errors.lastName}/>
                <FormField id="email" label="Email" type="email" value={editingUser.email} onChange={handleFormChange} required error={errors.email}/>
                <FormField id="phone" label="Phone" value={editingUser.phone} onChange={handleFormChange} />
                <FormField id="role" label="Role" as="select" value={editingUser.role} onChange={handleFormChange}>
                    {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                </FormField>
                <FormField id="jobTitle" label="Job Title" value={editingUser.jobTitle} onChange={handleFormChange} />
            </div>
            <FormField id="department" label="Department" value={editingUser.department} onChange={handleFormChange} />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
            <button onClick={handleSaveChanges} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Save Changes</button>
          </div>
        </Modal>
      )}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Employee Deletion"
        size="sm"
        footer={
            <div className="flex justify-end gap-3">
                <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                    Cancel
                </button>
                <button
                    onClick={handleDeleteEmployee}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                    Confirm Delete
                </button>
            </div>
        }
      >
        <p className="text-gray-600">
            Are you sure you want to permanently delete <strong>{user.firstName} {user.lastName}</strong>? This will unassign them from all stories, teams, and projects. This action cannot be undone.
        </p>
      </Modal>
    </>
  );
};

export default Profile;