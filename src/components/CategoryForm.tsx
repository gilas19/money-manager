import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useCategoryStore } from '@/store/categoryStore';
import { Category } from '@/types';
import dynamic from 'next/dynamic';

// Dynamically import EmojiPicker to avoid SSR issues
const EmojiPicker = dynamic(() => import('emoji-picker-react').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="h-[350px] w-full bg-gray-100 animate-pulse rounded-md"></div>
});

interface CategoryFormProps {
  onClose: () => void;
  editCategory?: Category;
}

type FormData = {
  name: string;
  emoji: string;
};

const CategoryForm: React.FC<CategoryFormProps> = ({ onClose, editCategory }) => {
  const { userData } = useAuth();
  const { addCategory, updateCategory } = useCategoryStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: editCategory?.name || '',
      emoji: editCategory?.emoji || '📋',
    }
  });
  
  const selectedEmoji = watch('emoji');
  
  const onSubmit = async (data: FormData) => {
    if (!userData) return;
    
    setIsSubmitting(true);
    
    try {
      const categoryData = {
        name: data.name,
        emoji: data.emoji,
        userId: userData.id,
      };
      
      if (editCategory) {
        await updateCategory(editCategory.id, categoryData);
      } else {
        await addCategory(categoryData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEmojiClick = (emojiData: any) => {
    setValue('emoji', emojiData.emoji);
    setShowEmojiPicker(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {editCategory ? 'Edit Category' : 'Add Category'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Emoji Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon
            </label>
            <div className="flex items-center">
              <Controller
                name="emoji"
                control={control}
                rules={{ required: 'Emoji is required' }}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-12 h-12 flex items-center justify-center text-2xl border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {field.value}
                  </button>
                )}
              />
              <span className="ml-3 text-sm text-gray-500">
                Click to select an emoji
              </span>
            </div>
            {errors.emoji && (
              <p className="mt-1 text-sm text-red-600">{errors.emoji.message}</p>
            )}
            
            {showEmojiPicker && (
              <div className="mt-2 border border-gray-200 rounded-md overflow-hidden">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
          
          {/* Category Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <Controller
              name="name"
              control={control}
              rules={{ 
                required: 'Category name is required',
                minLength: {
                  value: 2,
                  message: 'Category name must be at least 2 characters'
                }
              }}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className={`block w-full px-3 py-2 border ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="e.g. Groceries"
                />
              )}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
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

export default CategoryForm; 