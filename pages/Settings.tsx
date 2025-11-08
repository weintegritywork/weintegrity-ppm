import React, { useContext, useState } from 'react';
import Card from '../components/Card';
import FormField from '../components/FormField';
import { ToastContext } from '../context/ToastContext';
import { SettingsContext } from '../context/SettingsContext';
import { DataContext } from '../context/DataContext';
import { AuthContext } from '../context/AuthContext';
import { Role, User } from '../types';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import SelectDropdown from '../components/SelectDropdown';

// Helper component for consistent UI
const ToggleSwitch: React.FC<{ label: string; isChecked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; }> = ({ label, isChecked, onChange, disabled = false }) => (
    <div className="flex items-center justify-between py-2">
        <span className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}</span>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={isChecked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" disabled={disabled} />
            <div className={`w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${disabled ? 'cursor-not-allowed opacity-50' : ''} peer-checked:bg-blue-600`}></div>
        </label>
    </div>
);

// Settings Manager Component
const SettingsManager: React.FC = () => {
    const { addToast } = useContext(ToastContext)!;
    const { settings, updateGlobalSetting, updateAccessControl } = useContext(SettingsContext)!;
    const { users, updateUser } = useContext(DataContext)!;
    const { currentUser } = useContext(AuthContext)!;
    
    // Local state for inputs
    const [portalName, setPortalName] = useState(settings.portalName);
    const [landingPage, setLandingPage] = useState(settings.defaultLandingPage);
    const [timeout, setTimeoutDuration] = useState(settings.sessionTimeout);
    const [announcement, setAnnouncement] = useState(settings.announcement.message);
    const [footerText, setFooterText] = useState(settings.footerText);
    
    const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
    const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false);
    const [userToReset, setUserToReset] = useState<User | null>(null);

    const isAdmin = currentUser!.role === Role.Admin;
    const userPermissions = settings.accessControl[currentUser!.role];

    const handleSave = (settingName: string) => {
        addToast(`✅ ${settingName} updated successfully!`, 'success');
    };
    
    const handlePortalSettingsSave = () => {
        updateGlobalSetting('portalName', portalName);
        updateGlobalSetting('defaultLandingPage', landingPage);
        updateGlobalSetting('footerText', footerText);
        handleSave('Portal Settings');
    };

    const handleSystemControlsSave = () => {
        updateGlobalSetting('sessionTimeout', timeout);
        handleSave('System Controls');
    };
    
    const handlePublishAnnouncement = () => {
        updateGlobalSetting('announcement', { message: announcement, isVisible: true });
        addToast('✅ Announcement published!', 'success');
    };

    const handleRetractAnnouncement = () => {
        updateGlobalSetting('announcement', { message: announcement, isVisible: false });
        addToast('✅ Announcement retracted!', 'success');
    };

    const handleUserStatusToggle = (user: User) => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        updateUser(user.id, { status: newStatus });
        addToast(`${user.firstName}'s account is now ${newStatus}.`, 'info');
    };

    const handlePasswordReset = (user: User) => {
        setUserToReset(user);
        setIsResetPwdModalOpen(true);
    };

    const confirmPasswordReset = () => {
        if (userToReset) {
            const newPassword = 'password123'; // Mock new password
            updateUser(userToReset.id, { password: newPassword });
            addToast(`Password for ${userToReset.firstName} has been reset to "${newPassword}"`, 'success');
        }
        setIsResetPwdModalOpen(false);
        setUserToReset(null);
    };

    const timeoutOptions = [
        { value: '15', label: '15 Minutes' },
        { value: '30', label: '30 Minutes' },
        { value: '60', label: '1 Hour' },
        { value: '0', label: 'Disabled' },
    ];

    return (
        <div className="space-y-6">
            {userPermissions.canManageBranding && (
                <Card title="Portal Settings">
                    <div className="space-y-4">
                        <FormField id="portalName" label="Portal Name / Title" value={portalName} onChange={(e) => setPortalName(e.target.value)} />
                        {isAdmin && <FormField id="defaultLandingPage" label="Default Landing Page" as="select" value={landingPage} onChange={e => setLandingPage(e.target.value)}>
                            <option value="/dashboard">Dashboard</option>
                            <option value="/projects">Projects</option>
                            <option value="/stories">Stories</option>
                        </FormField>}
                        <FormField as="textarea" id="footerText" label="Footer Branding / Copyright Text" value={footerText} onChange={e => setFooterText(e.target.value)} />
                    </div>
                    <div className="mt-4 text-right">
                        <button onClick={handlePortalSettingsSave} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm">Save Portal Settings</button>
                    </div>
                </Card>
            )}

            {isAdmin && (
                <Card title="System & Access Controls">
                    <ToggleSwitch label="Maintenance Mode" isChecked={settings.maintenanceMode} onChange={(c) => updateGlobalSetting('maintenanceMode', c)} />
                    <hr className="my-2"/>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-gray-700">Access Control Management</span>
                        <button onClick={() => setIsAccessModalOpen(true)} className="text-sm text-blue-600 hover:underline">Manage Permissions</button>
                    </div>
                    <hr className="my-2"/>
                    <SelectDropdown
                        label="Session Timeout Duration"
                        value={String(timeout)}
                        onChange={(value) => setTimeoutDuration(Number(value))}
                        options={timeoutOptions}
                    />
                    <div className="mt-4 text-right">
                        <button onClick={handleSystemControlsSave} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm">Save System Controls</button>
                    </div>
                </Card>
            )}

            {userPermissions.canManageUsers && (
                <Card title="User Account Management">
                    <div className="max-h-72 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500">User</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="px-4 py-2">
                                        <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                                        <div className="text-gray-500">{user.email} ({user.role})</div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <ToggleSwitch label={user.status === 'active' ? 'Active' : 'Inactive'} isChecked={user.status === 'active'} onChange={() => handleUserStatusToggle(user)} />
                                    </td>
                                    <td className="px-4 py-2 space-x-2">
                                        <button onClick={() => handlePasswordReset(user)} className="text-blue-600 hover:underline">Reset Pwd</button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
            
            {isAdmin && (
                 <Card title="Global Notifications / Announcements">
                    <FormField as="textarea" id="announcement" label="Announcement Message" value={announcement} onChange={e => setAnnouncement(e.target.value)} />
                    <div className="mt-4 flex justify-end gap-2">
                        <button onClick={handleRetractAnnouncement} className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors text-sm">Retract</button>
                        <button onClick={handlePublishAnnouncement} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-sm">Publish</button>
                    </div>
                </Card>
            )}

            {/* Modals */}
            <Modal isOpen={isAccessModalOpen} onClose={() => setIsAccessModalOpen(false)} title="Module Access Control">
                 <p className="text-sm text-gray-600 mb-4">Define which roles can access key modules. Changes are saved instantly.</p>
                <div className="space-y-4">
                    {Object.values(Role).filter(r => r !== Role.Admin).map(role => (
                        <div key={role}>
                            <h4 className="font-semibold text-gray-800 border-b pb-2 mb-2">{role} Access</h4>
                             <ToggleSwitch label="Can view Teams page" isChecked={settings.accessControl[role].canViewTeams} onChange={(c) => updateAccessControl(role, 'canViewTeams', c)} />
                             <ToggleSwitch label="Can view Employees page" isChecked={settings.accessControl[role].canViewEmployees} onChange={(c) => updateAccessControl(role, 'canViewEmployees', c)} />
                        </div>
                    ))}
                </div>
                 <div className="mt-6 text-right">
                    <button onClick={() => setIsAccessModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Close</button>
                </div>
            </Modal>
             <Modal isOpen={isResetPwdModalOpen} onClose={() => setIsResetPwdModalOpen(false)} title="Reset Password" size="sm">
                <p>Are you sure you want to reset the password for <strong>{userToReset?.firstName} {userToReset?.lastName}</strong>?</p>
                <p className="text-sm text-gray-500 mt-2">The password will be reset to a default value: "password123".</p>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => setIsResetPwdModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={confirmPasswordReset} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Confirm Reset</button>
                </div>
            </Modal>
        </div>
    );
};


const Settings: React.FC = () => {
    return (
        <div>
            <PageHeader title="Settings" showBackButton={false} />
            <SettingsManager />
        </div>
    );
};

export default Settings;