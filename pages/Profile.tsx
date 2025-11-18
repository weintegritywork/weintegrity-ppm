

import React, { useContext, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import Card from '../components/Card';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { Story, StoryState, Role, User, WorkLocation } from '../types';
import { isEmailUnique, isPhoneUnique } from '../utils/validators';
import SelectDropdown from '../components/SelectDropdown';
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
  const [skillInput, setSkillInput] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Debug logging
  console.log('=== PROFILE DEBUG ===');
  console.log('User object:', user);
  console.log('User projectId:', user.projectId, 'Type:', typeof user.projectId);
  console.log('User teamId:', user.teamId, 'Type:', typeof user.teamId);
  console.log('All projects:', projects);
  console.log('Project IDs:', projects.map(p => ({ id: p.id, name: p.name, type: typeof p.id })));
  console.log('Found project:', project);
  console.log('Found team:', team);
  console.log('==================');

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
    
    setIsPasswordUpdating(true);
    try {
      await updateUser(user.id, { password: newPassword });
      toastContext.addToast("Password updated successfully!", 'success');
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    } catch (error) {
      toastContext.addToast('Failed to update password. Please try again.', 'error');
    } finally {
      setIsPasswordUpdating(false);
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

  const handleAddSkill = () => {
    if (editingUser && skillInput.trim() && !editingUser.skills?.includes(skillInput.trim())) {
      setEditingUser({
        ...editingUser,
        skills: [...(editingUser.skills || []), skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (editingUser) {
      setEditingUser({
        ...editingUser,
        skills: editingUser.skills?.filter(skill => skill !== skillToRemove)
      });
    }
  };

  const handleSkillKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const validate = (): boolean => {
    if (!editingUser) return false;
    const newErrors: Record<string, string> = {};
    if (!editingUser.firstName) newErrors.firstName = 'First name is required';
    if (!editingUser.lastName) newErrors.lastName = 'Last name is required';
    if (!editingUser.email) newErrors.email = 'Email is required';
    else if (!isEmailUnique(editingUser.email, users, editingUser.id)) newErrors.email = 'Email already exists';
    if (!editingUser.phone) newErrors.phone = 'Phone is required';
    else if (!isPhoneUnique(editingUser.phone, users, editingUser.id)) newErrors.phone = 'Phone number already exists';
    if (!editingUser.department) newErrors.department = 'Department is required';
    if (!editingUser.jobTitle) newErrors.jobTitle = 'Job title is required';
    if (!editingUser.dateOfJoining) newErrors.dateOfJoining = 'Date of joining is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (editingUser && validate()) {
        setIsSaving(true);
        try {
          await updateUser(user.id, editingUser);
          toastContext.addToast('Employee details updated successfully!', 'success');
          setIsEditModalOpen(false);
        } catch (error) {
          toastContext.addToast('Failed to update employee. Please try again.', 'error');
        } finally {
          setIsSaving(false);
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

    setIsDeleting(true);
    try {
      await deleteUser(user.id);
      toastContext.addToast('Employee has been permanently deleted.', 'success');
      navigate('/employees');
    } catch (error) {
      toastContext.addToast('Failed to delete employee. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
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
              <h2 className="text-2xl font-bold dark:text-white">{user.firstName} {user.lastName}</h2>
              <p className="text-gray-500 dark:text-gray-400">{user.jobTitle}</p>
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
              {user.experience !== undefined && <DetailItem label="Experience" value={`${user.experience} years`} />}
              {user.nativeLocation && <DetailItem label="Native Location" value={user.nativeLocation} />}
              {user.workLocation && <DetailItem label="Work Location" value={user.workLocation} />}
              {user.skills && user.skills.length > 0 && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Skills</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {user.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">Password Requirements:</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• At least 8 characters long</li>
              <li>• Contains at least one uppercase letter</li>
              <li>• Contains at least one lowercase letter</li>
              <li>• Contains at least one number</li>
              <li>• Contains at least one special character (!@#$%^&*...)</li>
            </ul>
          </div>
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
          <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" disabled={isPasswordUpdating}>Cancel</button>
          <button onClick={handlePasswordUpdate} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center" disabled={isPasswordUpdating}>
            {isPasswordUpdating && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isPasswordUpdating ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </Modal>

      {editingUser && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Employee Details" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField id="firstName" label="First Name" value={editingUser.firstName} onChange={handleFormChange} required error={errors.firstName} />
                <FormField id="lastName" label="Last Name" value={editingUser.lastName} onChange={handleFormChange} required error={errors.lastName}/>
                <FormField id="email" label="Email" type="email" value={editingUser.email} onChange={handleFormChange} required error={errors.email}/>
                <FormField id="phone" label="Phone" value={editingUser.phone} onChange={handleFormChange} required error={errors.phone} />
                <FormField id="dateOfJoining" label="Date of Joining" type="date" value={editingUser.dateOfJoining} onChange={handleFormChange} required error={errors.dateOfJoining} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <SelectDropdown
                    value={editingUser.role}
                    onChange={(value) => setEditingUser({ ...editingUser, role: value as Role })}
                    options={Object.values(Role).map(role => ({ value: role, label: role }))}
                  />
                  {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
                </div>
                <FormField id="department" label="Department" value={editingUser.department} onChange={handleFormChange} required error={errors.department} />
                <FormField id="jobTitle" label="Job Title" value={editingUser.jobTitle} onChange={handleFormChange} required error={errors.jobTitle} />
                <FormField 
                  id="experience" 
                  label="Years of Experience" 
                  type="number" 
                  value={editingUser.experience?.toString() || ''} 
                  onChange={(e) => setEditingUser({ ...editingUser, experience: e.target.value ? parseInt(e.target.value) : undefined })} 
                  placeholder="e.g., 5"
                />
                <FormField 
                  id="nativeLocation" 
                  label="Native Location" 
                  value={editingUser.nativeLocation || ''} 
                  onChange={handleFormChange} 
                  placeholder="e.g., New York, USA"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Location
                  </label>
                  <SelectDropdown
                    value={editingUser.workLocation || ''}
                    onChange={(value) => setEditingUser({ ...editingUser, workLocation: value as WorkLocation })}
                    options={[
                      { value: '', label: 'Select Work Location' },
                      ...Object.values(WorkLocation).map(loc => ({ value: loc, label: loc }))
                    ]}
                  />
                </div>
            </div>

            {/* Skills Section */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={handleSkillKeyPress}
                  placeholder="Add a skill (e.g., React, Python)"
                  className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add
                </button>
              </div>
              {editingUser.skills && editingUser.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {editingUser.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-blue-900 font-bold"
                        title="Remove skill"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" disabled={isSaving}>Cancel</button>
            <button onClick={handleSaveChanges} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center" disabled={isSaving}>
              {isSaving && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
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
                    disabled={isDeleting}
                >
                    Cancel
                </button>
                <button
                    onClick={handleDeleteEmployee}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 flex items-center"
                    disabled={isDeleting}
                >
                    {isDeleting && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
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