
import { User } from '../types';

export const isEmailUnique = (email: string, users: User[], currentUserId?: string): boolean => {
  return !users.some(user => 
    user.id !== currentUserId && user.email.toLowerCase() === email.toLowerCase()
  );
};

export const isPhoneUnique = (phone: string, users: User[], currentUserId?: string): boolean => {
  return !users.some(user => 
    user.id !== currentUserId && user.phone === phone
  );
};
