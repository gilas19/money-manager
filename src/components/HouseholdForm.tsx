import React, { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useHouseholdStore } from '@/store/householdStore';
import { Household } from '@/types';
import { FaPlus, FaTrash, FaUsers, FaEnvelope } from 'react-icons/fa';

interface HouseholdFormProps {
  onClose: () => void;
  editHousehold?: Household;
}

type FormData = {
  name: string;
  invitedEmails: { email: string }[];
};

const HouseholdForm: React.FC<HouseholdFormProps> = ({ onClose, editHousehold }) => {
  const { userData } = useAuth();
  const { createHousehold, updateHousehold, inviteMember, removeMember, cancelInvitation } = useHouseholdStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: editHousehold?.name || '',
      invitedEmails: editHousehold?.invitedEmails.map(email => ({ email })) || [{ email: '' }],
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'invitedEmails',
  });
  
  const handleRemoveMember = async (userId: string) => {
    if (!editHousehold || !userData) return;
    
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await removeMember(editHousehold.id, userId);
      } catch (error) {
        console.error('Error removing member:', error);
        alert('Failed to remove member');
      }
    }
  };
  
  const handleCancelInvitation = async (email: string) => {
    if (!editHousehold) return;
    
    if (window.confirm(`Are you sure you want to cancel the invitation to ${email}?`)) {
      try {
        await cancelInvitation(editHousehold.id, email);
        // Remove the email from the form fields
        const emailIndex = fields.findIndex(field => field.email === email);
        if (emailIndex !== -1) {
          remove(emailIndex);
        }
      } catch (error) {
        console.error('Error canceling invitation:', error);
        alert('Failed to cancel invitation');
      }
    }
  };
  
  const onSubmit = async (data: FormData) => {
    if (!userData) return;
    
    setIsSubmitting(true);
    
    try {
      // Filter out empty email fields
      const validEmails = data.invitedEmails
        .map(item => item.email.trim())
        .filter(email => email !== '');
      
      if (editHousehold) {
        // Update household name
        await updateHousehold(editHousehold.id, { name: data.name });
        
        // Add new invites
        const existingEmails = new Set(editHousehold.invitedEmails);
        for (const email of validEmails) {
          if (!existingEmails.has(email)) {
            await inviteMember(editHousehold.id, email);
          }
        }
      } else {
        // Create new household
        await createHousehold({
          name: data.name,
          ownerId: userData.id,
          members: [userData.id],
          invitedEmails: validEmails,
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving household:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {editHousehold ? 'Edit Household' : 'Create Household'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Household Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Household Name
            </label>
            <Controller
              name="name"
              control={control}
              rules={{ 
                required: 'Household name is required',
                minLength: {
                  value: 2,
                  message: 'Household name must be at least 2 characters'
                }
              }}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className={`block w-full px-3 py-2 border ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="e.g. Family Budget"
                />
              )}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          
          {/* Current Members - Only show when editing */}
          {editHousehold && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Members
              </label>
              <div className="space-y-2 border border-gray-200 rounded-md p-3">
                {editHousehold.members.map(memberId => (
                  <div key={memberId} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <FaUsers className="text-gray-500" />
                      </div>
                      <span className="ml-2 text-sm">
                        {memberId === userData?.id ? 'You' : memberId}
                        {memberId === editHousehold.ownerId && ' (Owner)'}
                      </span>
                    </div>
                    {memberId !== userData?.id && memberId !== editHousehold.ownerId && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(memberId)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Current Invitations - Only show when editing */}
          {editHousehold && editHousehold.invitedEmails.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pending Invitations
              </label>
              <div className="space-y-2 border border-gray-200 rounded-md p-3">
                {editHousehold.invitedEmails.map(email => (
                  <div key={email} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <FaEnvelope className="text-gray-500" />
                      </div>
                      <span className="ml-2 text-sm">{email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCancelInvitation(email)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Invite Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {editHousehold ? 'Invite More Members' : 'Invite Members'} (by email)
            </label>
            
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <Controller
                    name={`invitedEmails.${index}.email`}
                    control={control}
                    rules={{
                      pattern: {
                        value: /^$|^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    }}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="email"
                        className={`block flex-1 px-3 py-2 border ${
                          errors.invitedEmails?.[index]?.email ? 'border-red-500' : 'border-gray-300'
                        } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="email@example.com"
                      />
                    )}
                  />
                  
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 text-red-500 hover:text-red-700"
                    disabled={fields.length === 1}
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              ))}
              
              {errors.invitedEmails && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.invitedEmails.message}
                </p>
              )}
              
              <button
                type="button"
                onClick={() => append({ email: '' })}
                className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <FaPlus size={12} className="mr-1" /> Add another email
              </button>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HouseholdForm; 